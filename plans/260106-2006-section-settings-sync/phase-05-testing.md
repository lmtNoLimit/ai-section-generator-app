# Phase 05: Testing & Polish

**Effort**: 0.5h

## Objective
Comprehensive testing, edge cases, UX polish.

## Test Scenarios

### 1. Basic Sync Flow
```
1. Generate section with text setting default="Hello"
2. Edit text to "World" in SettingsPanel
3. Wait 2s (debounce)
4. Verify schema updated: default: "World"
5. Refresh page
6. Verify text still shows "World"
```

### 2. Multiple Rapid Edits
```
1. Type "abc" quickly (< 2s total)
2. Verify only ONE save occurs (after final keystroke + 2s)
3. Schema shows "abc" not intermediate states
```

### 3. Reset Functionality
```
1. Edit multiple settings
2. Click Reset
3. Verify UI shows schema defaults
4. Verify isDirty = false
5. Verify code reverts to original defaults
```

### 4. Resource Settings
```
1. Select a product in product picker
2. Verify preview shows product
3. Verify schema NOT updated (no default added)
4. Refresh page
5. Verify product picker is empty (expected)
```

### 5. Block Settings
```
1. Edit block heading (text type)
2. Verify preview updates
3. Verify preset NOT updated (text is non-presentational)
4. Edit block color (color type)
5. Verify preset block.settings updated
```

### 6. AI Regeneration
```
1. Edit settings and save
2. Send chat message to AI
3. AI regenerates section
4. Verify new schema replaces old
5. Settings reset to new defaults
```

### 7. Version History
```
1. Edit settings
2. Select old version from history
3. Settings revert to old version defaults
4. Apply version
5. Settings persist as new defaults
```

## Edge Cases

### Empty Schema
```typescript
// Liquid without {% schema %}
test('handles missing schema gracefully', () => {
  const code = '<div>No schema</div>';
  const result = updateSchemaDefaults(code, { heading: 'Test' });
  expect(result).toBe(code); // Unchanged
});
```

### Malformed JSON
```typescript
test('handles invalid JSON in schema', () => {
  const code = '{% schema %}{ invalid {% endschema %}';
  const result = updateSchemaDefaults(code, { heading: 'Test' });
  expect(result).toBe(code); // Unchanged, logged error
});
```

### Type Coercion
```typescript
test('coerces types correctly', () => {
  // number setting with string input
  const settings = { padding: '20' }; // from input
  // Should store as number in schema
  expect(schema.settings[0].default).toBe(20);
});
```

### Setting ID Not in Schema
```typescript
test('ignores unknown setting IDs', () => {
  const settings = { unknown_id: 'value', heading: 'Test' };
  // Only heading should be updated, unknown_id ignored
});
```

## UX Polish

### 1. Auto-save Indicator
```typescript
// Show subtle "Saving..." during debounce
const [isSyncing, setIsSyncing] = useState(false);

// In header
{isSyncing && <s-text color="subdued">Auto-saving...</s-text>}
```

### 2. Offline Handling
```typescript
// Queue saves when offline
if (!navigator.onLine) {
  // Store in localStorage
  // Sync when back online
}
```

### 3. Conflict Resolution
```typescript
// If code changed externally (AI, version apply)
// Show prompt: "Settings were reset due to code change"
```

### 4. Settings Diff Badge
```typescript
// Show count of changed settings
{changedCount > 0 && (
  <s-badge>{changedCount} changed</s-badge>
)}
```

## Performance Considerations

- Debounce prevents excessive saves
- Only update schema if values actually changed
- JSON.stringify comparison is O(n) but acceptable for small settings
- Consider shallow compare for large forms

## Documentation Updates

- Update README preview section
- Add inline help text in SettingsPanel
- Document resource settings limitation
- Add troubleshooting for sync issues
