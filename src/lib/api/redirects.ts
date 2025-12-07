// lib/api/redirects.ts - Helper functions for redirects

export const checkInstructorApproval = async (token) => {
  try {
    const response = await fetch('http://localhost:5000/api/users/profile', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) throw new Error('Failed to check approval status');

    const data = await response.json();
    return data.data?.instructorStatus;
  } catch (error) {
    console.error('Error checking instructor approval:', error);
    return null;
  }
};

export const handleInstructorRedirect = async (router, token) => {
  if (!token) {
    router.replace('/auth/login');
    return;
  }

  const status = await checkInstructorApproval(token);

  if (status === 'approved') {
    // Allow access
    return true;
  } else if (status === 'pending') {
    router.replace('/instructor/pending-approval');
    return false;
  } else if (status === 'rejected') {
    router.replace('/instructor/application-rejected');
    return false;
  } else {
    router.replace('/auth/login');
    return false;
  }
};
