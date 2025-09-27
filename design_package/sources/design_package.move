module design_package::design_registry {
    use sui::object::{Self, ID, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::dynamic_object_field as dof;
    use std::string::{Self as string, String};
    use std::option;
    use sui::event;
    // vector<T> is a builtin type; no import needed
    use sui::bcs;

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
    const E_ACCESS_DENIED: u64 = 3;
    const E_INVALID_POLICY: u64 = 4;

    // Events
    public struct DesignCreated has copy, drop {
        id: ID,
        name: String,
        owner: address
    }

    public struct DesignUpdated has copy, drop {
        id: ID,
        new_blob_id: String
    }

    public struct DesignPublished has copy, drop {
        id: ID,
        public_blob_id: String
    }

    /// Initialize the registry. Called once when publishing the module.
    fun init(ctx: &mut TxContext) {
        let registry = DesignRegistry {
            id: object::new(ctx)
        };
        transfer::share_object(registry);
    }

    /// Create a new design
    public entry fun create_design(
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
        let design_id: ID = object::id(&design);
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
    public entry fun update_design(
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
    public entry fun publish_design(
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
    public entry fun get_design_metadata(
        registry: &DesignRegistry,
        design_id: ID,
    ): (String, address, u64, u64, u64, String, String, option::Option<String>, option::Option<u64>) {
        let design = dof::borrow<ID, DesignMetadata>(&registry.id, design_id);
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

    /// CRITICAL: Seal access control function
    /// This function is called by Seal key servers to validate access to encrypted data
    /// The first parameter must be the requested identity (without package ID prefix)
    /// This function must abort if access is not granted
    public entry fun seal_approve(
        id: vector<u8>,
        design_id: ID,
        registry: &DesignRegistry,
        _ctx: &TxContext
    ) {
        // Validate the requested identity bytes (id) against the design owner
        let design = dof::borrow<ID, DesignMetadata>(&registry.id, design_id);

        // Owner check: compare BCS bytes of owner address to provided id
        let owner_bytes = bcs::to_bytes(&design.owner);
        if (owner_bytes == id) {
            return
        };

        // Optional: allow access if design has been published (public)
        if (option::is_some(&design.public_blob_id)) {
            return
        };

        // Access denied by default
        abort E_ACCESS_DENIED
    }

    /// Alternative seal_approve function for different access patterns
    /// This version allows access based on design publication status
    public entry fun seal_approve_public(
        id: vector<u8>,
        design_id: ID,
        registry: &DesignRegistry,
        ctx: &TxContext
    ) {
        let design = dof::borrow<ID, DesignMetadata>(&registry.id, design_id);
        
        // Check if design is published (public access)
        if (option::is_some(&design.public_blob_id)) {
            return // Public design, anyone can access
        };
        
        // Check ownership for private designs
        let requester = tx_context::sender(ctx);
        if (design.owner == requester) {
            return // Owner has access
        };
        
        // Access denied
        abort E_ACCESS_DENIED
    }

    /// Seal approve function for collaborative access
    /// This version implements a simple collaborative model
    public entry fun seal_approve_collaborative(
        id: vector<u8>,
        design_id: ID,
        registry: &DesignRegistry,
        ctx: &TxContext
    ) {
        let design = dof::borrow<ID, DesignMetadata>(&registry.id, design_id);
        let requester = tx_context::sender(ctx);
        
        // Owner always has access
        if (design.owner == requester) {
            return
        };
        
        // For collaborative access, we could implement:
        // - Check against a collaborator list
        // - Verify the requester has been granted access
        // - Check time-based permissions
        
        // For now, we'll implement a simple check based on the encryption policy ID
        // In a real implementation, you would decode the policy and check permissions
        let policy_id = design.encryption_policy_id;
        
        // Simple policy check: if the policy contains the requester's address
        // This is a placeholder - implement your actual policy logic
        if (string::length(&policy_id) > 0) {
            // In a real implementation, you would:
            // 1. Decode the policy
            // 2. Check if the requester is authorized
            // 3. Verify any time-based or condition-based restrictions
            
            // For now, we'll allow access if the policy is not empty
            // This should be replaced with proper policy validation
            return
        };
        
        // Access denied
        abort E_ACCESS_DENIED
    }
}
