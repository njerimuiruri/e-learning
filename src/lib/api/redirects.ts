// lib/api/redirects.ts - Helper functions for redirects

export const checkInstructorApproval = async (token) => {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const response = await fetch(`${apiUrl}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) throw new Error('Failed to check approval status');

    const data = await response.json();
    return data.user?.instructorStatus;
  } catch (error) {
    console.error('Error checking instructor approval:', error);
    return null;
  }
};

export const handleInstructorRedirect = async (router, token) => {
  if (!token) {
    router.replace('/login');
    return false;
  }

  const status = await checkInstructorApproval(token);

  if (status === 'approved') {
    // Allow access to instructor dashboard
    return true;
  } else if (status === 'pending') {
    router.replace('/instructor/pending-approval');
    return false;
  } else if (status === 'rejected') {
    router.replace('/instructor/application-rejected');
    return false;
  } else {
    router.replace('/login');
    return false;
  }
};

// Check if instructor is approved and redirect accordingly
export const redirectBasedOnInstructorStatus = async (router, userStatus: string) => {
  if (userStatus === 'approved') {
    return true; // Allow access
  } else if (userStatus === 'pending') {
    router.replace('/instructor/pending-approval');
    return false;
  } else if (userStatus === 'rejected') {
    router.replace('/instructor/application-rejected');
    return false;
  } else {
    router.replace('/login');
    return false;
  }
};
