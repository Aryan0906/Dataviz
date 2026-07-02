from django.db import models

class DeletedSyncRecord(models.Model):
    model_name = models.CharField(max_length=100)
    object_id = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "deleted_sync_records"

    def save(self, *args, **kwargs):
        kwargs['using'] = 'sqlite'
        super().save(*args, **kwargs)


class SyncModel(models.Model):
    pending_sync = models.BooleanField(default=False, db_index=True)

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        from dataviz_backend.db_router import is_supabase_online
        
        db = kwargs.get('using', None)
        if db:
            super().save(*args, **kwargs)
            return

        online = is_supabase_online()
        if online:
            self.pending_sync = False
            super().save(*args, **kwargs)
            
            # Save copy to local SQLite cache
            try:
                kwargs['using'] = 'sqlite'
                super().save(*args, **kwargs)
            except Exception as e:
                import logging
                logging.getLogger(__name__).error(f"Failed to cache save in SQLite: {e}")
        else:
            self.pending_sync = True
            kwargs['using'] = 'sqlite'
            super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        from dataviz_backend.db_router import is_supabase_online
        
        db = kwargs.get('using', None)
        if db:
            super().delete(*args, **kwargs)
            return

        online = is_supabase_online()
        if online:
            super().delete(*args, **kwargs)
            
            # Delete copy from local SQLite cache
            try:
                kwargs['using'] = 'sqlite'
                super().delete(*args, **kwargs)
            except Exception as e:
                import logging
                logging.getLogger(__name__).error(f"Failed to delete copy from SQLite: {e}")
        else:
            try:
                DeletedSyncRecord.objects.create(
                    model_name=f"{self._meta.app_label}.{self._meta.model_name}",
                    object_id=str(self.pk)
                )
            except Exception as e:
                import logging
                logging.getLogger(__name__).error(f"Failed to log offline delete: {e}")
                
            kwargs['using'] = 'sqlite'
            super().delete(*args, **kwargs)
