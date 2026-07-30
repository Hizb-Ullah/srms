// Permission map for the Lot Allocation feature's group + sub-role RBAC.
// Director and Files Controller both get full ('*') authority over every DSM
// sub-task, per client spec ("Director has identical authority to Files
// Controller", "Files Controller has full authority to perform any task
// available to every other DSM sub-account").
const PERMISSIONS = {
  DSM: {
    Director: ['*'],  // includes approve_users
    'Files Controller': ['*'],
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
    RMU: ['rmu_manage', 'view_lot_requests']
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
