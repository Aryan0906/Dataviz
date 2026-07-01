import logging
from django.apps import apps
from dataviz_backend.db_router import force_db, is_supabase_online

logger = logging.getLogger(__name__)

def sync_offline_data():
    """Sync offline data from SQLite to Supabase when connection is available."""
    if not is_supabase_online():
        return 0, 0 # Not online
        
    synced_saves = 0
    synced_deletes = 0
    
    try:
        from .models import DeletedSyncRecord
        
        # 1. Process deletes first
        # Read deleted records from sqlite
        with force_db('sqlite'):
            deletes = list(DeletedSyncRecord.objects.all())
            
        for d in deletes:
            try:
                # Find the model class
                model = apps.get_model(d.model_name)
                # Delete from supabase
                with force_db('supabase'):
                    model.objects.filter(id=d.object_id).delete()
                # Remove delete record from sqlite
                with force_db('sqlite'):
                    d.delete()
                synced_deletes += 1
            except Exception as ex:
                logger.error(f"Failed to sync delete for {d.model_name} id {d.object_id}: {ex}")
                
        # 2. Process saves/updates for each model
        # We find all models that have 'pending_sync' field
        syncable_models = []
        for model in apps.get_models():
            if hasattr(model, 'pending_sync'):
                syncable_models.append(model)
                
        # Ensure Workspaces are synced first to maintain foreign key integrity
        def get_sync_priority(m):
            if m.__name__ == 'Workspace': return 0
            if m.__name__ == 'WorkspaceMembership': return 1
            return 2
            
        syncable_models.sort(key=get_sync_priority)
                
        for model in syncable_models:
            # Read pending objects from sqlite
            with force_db('sqlite'):
                pending_objects = list(model.objects.filter(pending_sync=True))
                
            for obj in pending_objects:
                try:
                    # Save to supabase
                    with force_db('supabase'):
                        # Set pending_sync to False on supabase
                        obj.pending_sync = False
                        
                        # Use update_or_create to handle updates cleanly
                        # First extract all fields except relation fields or auto fields
                        fields = {}
                        for field in obj._meta.fields:
                            if not field.primary_key:
                                # Copy values
                                fields[field.name] = getattr(obj, field.name)
                                
                        # Save
                        model.objects.update_or_create(id=obj.id, defaults=fields)
                        
                    # Mark as synced in sqlite
                    with force_db('sqlite'):
                        obj.pending_sync = False
                        obj.save()
                        
                    synced_saves += 1
                except Exception as ex:
                    logger.error(f"Failed to sync save for {model.__name__} id {obj.id}: {ex}")
                    
    except Exception as e:
        logger.error(f"Error during offline sync: {e}")
        
    return synced_saves, synced_deletes
