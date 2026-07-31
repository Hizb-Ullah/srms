// Permission map for the Lot Allocation feature's group + sub-role RBAC.
// Director gets full ('*') authority over every DSM sub-task, including lot
// number requests. Files Controller has full authority over every OTHER DSM
// sub-task (RMU, Registration, Capturing, Examination, Approval, Accounts,
// Storage) but explicitly NOT lot number requests — per client: "Controller
// has got nothing to do with lot number request", that's the Lot Allocator's
// domain alone.
const PERMISSIONS = {
  DSM: {
    Director: ['*'],  // includes approve_users
    'Files Controller': [
      'controller_workflow',
      'register_file', 'reserve_file',
      'capture_file',
      'examine_file',
      'approve_file',
      'rmu_manage',
      'accounts_manage',
      'storage_manage'
    ],
    'Lot Allocator': [
      'review_lot_request',
      'mark_payment_received',
      'approve_lot_request',
      'reject_lot_request',
      'view_lot_requests'
    ],
    'File Registration and Reservation': ['register_file', 'reserve_file'],
    'File Capturing': ['capture_file'],
    'File Examination': ['examine_file'],
    'File Approval': ['approve_file'],
    // RMU (Records Management Unit / Office) — receives physical records from
    // surveyors, records them in system, submits to Controller, receives them
    // back, and manages pending collections + payment receipt numbers.
    RMU: ['rmu_manage', 'view_lot_requests'],
    // Accounts — logs the Accounts-office receipt number against an already-
    // authorised request (bookkeeping only, per client's Accounts schema).
    Accounts: ['accounts_manage'],
    // Storage — views files RMU has dispatched to storage (scanned online +
    // hard copies filed) after collection.
    Storage: ['storage_manage']
  },
  Private: {
    'Registered Land Surveyor': ['submit_lot_request', 'upload_pop', 'view_own_lot_requests', 'submit_shape_scratch'],
    'Assistant Surveyor': ['submit_lot_request', 'upload_pop', 'view_own_lot_requests', 'submit_shape_scratch']
  },
  LandBoard: {
    'Registered Land Surveyor': ['submit_lot_request', 'upload_pop', 'view_own_lot_requests', 'submit_shape_scratch'],
    'Assistant Surveyor': ['submit_lot_request', 'upload_pop', 'view_own_lot_requests', 'submit_shape_scratch']
  }
}

// Check whether a user's group + subRole grants a given capability.
const hasCapability = (user, capability) => {
  if (!user || !user.group || !user.subRole) return false
  const groupPerms = PERMISSIONS[user.group]
  if (!groupPerms) return false
  const subRolePerms = groupPerms[user.subRole]
  if (!subRolePerms) return false
  return subRolePerms.includes('*') || subRolePerms.includes(capability)
}

module.exports = { PERMISSIONS, hasCapability }
