# Architecture rules
- Store the landing link label and destination as localized UI text settings in the existing app_settings table; this preserves deployment compatibility without schema changes.
- Store image engagement as analytics event payloads rather than dedicated columns; this keeps analytics extensible without schema changes.