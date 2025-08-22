// Find and replace these lines in AdminCategoryForm.jsx:

// Remove all setLoading(false) calls from the mutation callbacks
// The mutations handle their own loading state

// In the update mutation onSuccess callback, remove:
setLoading(false);

// In the update mutation onError callback, remove:
setLoading(false);

// In the create mutation onSuccess callback, remove:
setLoading(false);

// In the create mutation onError callback, remove:
setLoading(false);