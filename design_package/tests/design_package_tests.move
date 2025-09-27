#[test_only]
module design_package::design_registry_tests {
    use sui::test_scenario::{Self, Scenario};
    use design_package::design_registry::{Self, DesignRegistry};
    use std::string;
    use std::unit_test;
    use std::option;

    // Test addresses
    const ADMIN: address = @0xAD;
    const USER1: address = @0x1;
    const USER2: address = @0x2;

    fun test_setup(test: &mut Scenario) {
        test_scenario::next_tx(test, ADMIN);
        {
            design_registry::init(test_scenario::ctx(test));
        };
    }

    #[test]
    fun test_create_design() {
        let test = test_scenario::begin(ADMIN);
        test_setup(&mut test);

        test_scenario::next_tx(&mut test, USER1);
        {
            let registry = test_scenario::take_shared<DesignRegistry>(&test);
            let name = string::utf8(b"Test Design");
            let blob_id = string::utf8(b"test-blob-123");
            let policy_id = string::utf8(b"test-policy-123");

            let design_id = design_registry::create_design(
                &mut registry,
                name,
                blob_id,
                policy_id,
                test_scenario::ctx(&mut test)
            );

            // Verify design metadata
            let (
                ret_name,
                owner,
                _created_at,
                _updated_at,
                version,
                ret_blob_id,
                ret_policy_id,
                public_blob_id,
                published_at
            ) = design_registry::get_design_metadata(&registry, design_id);

            unit_test::assert_eq(ret_name, name);
            unit_test::assert_eq(owner, USER1);
            unit_test::assert_eq(version, 1);
            unit_test::assert_eq(ret_blob_id, blob_id);
            unit_test::assert_eq(ret_policy_id, policy_id);
            unit_test::assert_eq(public_blob_id, option::none());
            unit_test::assert_eq(published_at, option::none());

            test_scenario::return_shared(registry);
        };
        test_scenario::end(test);
    }

    #[test]
    fun test_update_design() {
        let test = test_scenario::begin(ADMIN);
        test_setup(&mut test);

        // First create a design
        test_scenario::next_tx(&mut test, USER1);
        let design_id;
        {
            let registry = test_scenario::take_shared<DesignRegistry>(&test);
            design_id = design_registry::create_design(
                &mut registry,
                string::utf8(b"Test Design"),
                string::utf8(b"test-blob-123"),
                string::utf8(b"test-policy-123"),
                test_scenario::ctx(&mut test)
            );
            test_scenario::return_shared(registry);
        };

        // Then update it
        test_scenario::next_tx(&mut test, USER1);
        {
            let registry = test_scenario::take_shared<DesignRegistry>(&test);
            let new_blob_id = string::utf8(b"test-blob-456");

            design_registry::update_design(
                &mut registry,
                design_id,
                new_blob_id,
                test_scenario::ctx(&mut test)
            );

            // Verify updated metadata
            let (
                _name,
                owner,
                _created_at,
                _updated_at,
                version,
                ret_blob_id,
                _policy_id,
                _public_blob_id,
                _published_at
            ) = design_registry::get_design_metadata(&registry, design_id);

            unit_test::assert_eq(owner, USER1);
            unit_test::assert_eq(version, 2);
            unit_test::assert_eq(ret_blob_id, new_blob_id);

            test_scenario::return_shared(registry);
        };
        test_scenario::end(test);
    }

    #[test]
    #[expected_failure(abort_code = design_registry::E_NOT_OWNER)]
    fun test_update_design_unauthorized() {
        let test = test_scenario::begin(ADMIN);
        test_setup(&mut test);

        // USER1 creates a design
        test_scenario::next_tx(&mut test, USER1);
        let design_id;
        {
            let registry = test_scenario::take_shared<DesignRegistry>(&test);
            design_id = design_registry::create_design(
                &mut registry,
                string::utf8(b"Test Design"),
                string::utf8(b"test-blob-123"),
                string::utf8(b"test-policy-123"),
                test_scenario::ctx(&mut test)
            );
            test_scenario::return_shared(registry);
        };

        // USER2 tries to update it (should fail)
        test_scenario::next_tx(&mut test, USER2);
        {
            let registry = test_scenario::take_shared<DesignRegistry>(&test);
            let new_blob_id = string::utf8(b"test-blob-456");

            design_registry::update_design(
                &mut registry,
                design_id,
                new_blob_id,
                test_scenario::ctx(&mut test)
            );

            test_scenario::return_shared(registry);
        };
        test_scenario::end(test);
    }

    #[test]
    fun test_publish_design() {
        let test = test_scenario::begin(ADMIN);
        test_setup(&mut test);

        // First create a design
        test_scenario::next_tx(&mut test, USER1);
        let design_id;
        {
            let registry = test_scenario::take_shared<DesignRegistry>(&test);
            design_id = design_registry::create_design(
                &mut registry,
                string::utf8(b"Test Design"),
                string::utf8(b"test-blob-123"),
                string::utf8(b"test-policy-123"),
                test_scenario::ctx(&mut test)
            );
            test_scenario::return_shared(registry);
        };

        // Then publish it
        test_scenario::next_tx(&mut test, USER1);
        {
            let registry = test_scenario::take_shared<DesignRegistry>(&test);
            let public_blob_id = string::utf8(b"public-blob-123");

            design_registry::publish_design(
                &mut registry,
                design_id,
                public_blob_id,
                test_scenario::ctx(&mut test)
            );

            // Verify published state
            let (
                _name,
                owner,
                _created_at,
                _updated_at,
                _version,
                _blob_id,
                _policy_id,
                ret_public_blob_id,
                published_at
            ) = design_registry::get_design_metadata(&registry, design_id);

            assert_eq(owner, USER1);
            assert_eq(ret_public_blob_id, option::some(public_blob_id));
            assert!(option::is_some(&published_at), 0);

            test_scenario::return_shared(registry);
        };
        test_scenario::end(test);
    }
}