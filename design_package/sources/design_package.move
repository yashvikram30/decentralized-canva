module decentralized-canva::design_registry {
    use sui::object::{Self, ID, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::dynamic_object_field as dof;
    use std::string::String;
    use std::option;
    use sui::event;

    /// Design metadata stored on-chain
    public struct DesignMetadata has key, store {
        id: UID,
        name: String,
        owner: address,
        created_at: u64,
        updated_at: u64,
        version: u64,
        blob_id: String,
        encryption_policy_id: String,
        public_blob_id: option::Option<String>,
        published_at: option::Option<u64>,
    }

    /// Registry to keep track of all designs
    public struct DesignRegistry has key {
        id: UID
    }

    // Error codes
    const E_NOT_OWNER: u64 = 0;
    const E_INVALID_BLOB_ID: u64 = 1;
    const E_DESIGN_NOT_FOUND: u64 = 2;

    // Events
    struct DesignCreated has copy, drop {
        id: ID,
        name: String,
        owner: address
    }

    struct DesignUpdated has copy, drop {
        id: ID,
        new_blob_id: String
    }

    struct DesignPublished has copy, drop {
        id: ID,
        public_blob_id: String
    }

    /// Initialize the registry. Called once when publishing the module.
    public fun init(ctx: &mut TxContext) {
        let registry = DesignRegistry {
            id: object::new(ctx)
        };
        transfer::share_object(registry);
    }

    /// Create a new design
    public fun create_design(
        registry: &mut DesignRegistry,
        name: String,
        blob_id: String,
        encryption_policy_id: String,
        ctx: &mut TxContext
    ): ID {
        let timestamp = tx_context::epoch_timestamp_ms(ctx);
        let sender = tx_context::sender(ctx);
        
        let design = DesignMetadata {
            id: object::new(ctx),
            name,
            owner: sender,
            created_at: timestamp,
            updated_at: timestamp,
            version: 1,
            blob_id,
            encryption_policy_id,
            public_blob_id: option::none(),
            published_at: option::none(),
        };

        // Store design as a dynamic field in registry
        dof::add(&mut registry.id, design_id, design);
        
        // Emit creation event
        event::emit(DesignCreated {
            id: design_id,
            name,
            owner: sender
        });

        design_id
    }

    /// Update an existing design
    public fun update_design(
        registry: &mut DesignRegistry,
        design_id: ID,
        new_blob_id: String,
        ctx: &mut TxContext
    ) {
        // Check ownership
        assert!(is_owner(registry, design_id, ctx), E_NOT_OWNER);

        let design = dof::borrow_mut<ID, DesignMetadata>(&mut registry.id, design_id);
        design.blob_id = new_blob_id;
        design.version = design.version + 1;
        design.updated_at = tx_context::epoch_timestamp_ms(ctx);

        event::emit(DesignUpdated {
            id: design_id,
            new_blob_id
        });
    }

    /// Publish a design (make it public)
    public fun publish_design(
        registry: &mut DesignRegistry,
        design_id: ID,
        public_blob_id: String,
        ctx: &mut TxContext
    ) {
        // Check ownership
        assert!(is_owner(registry, design_id, ctx), E_NOT_OWNER);

        let design = dof::borrow_mut<ID, DesignMetadata>(&mut registry.id, design_id);
        design.public_blob_id = option::some(public_blob_id);
        design.published_at = option::some(tx_context::epoch_timestamp_ms(ctx));

        event::emit(DesignPublished {
            id: design_id,
            public_blob_id
        });
    }

    /// Get design metadata
    public fun get_design_metadata(
        registry: &DesignRegistry,
        design_id: ID,
    ): (String, address, u64, u64, u64, String, String, Option<String>, Option<u64>) {
        let design = dof::borrow(&registry.id, design_id);
        (
            design.name,
            design.owner,
            design.created_at,
            design.updated_at,
            design.version,
            design.blob_id,
            design.encryption_policy_id,
            design.public_blob_id,
            design.published_at,
        )
    }

    /// Check if the sender is the owner of a design
    fun is_owner(registry: &DesignRegistry, design_id: ID, ctx: &TxContext): bool {
        let design = dof::borrow<ID, DesignMetadata>(&registry.id, design_id);
        design.owner == tx_context::sender(ctx)
    }
}

