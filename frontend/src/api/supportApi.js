import apiClient from './axios';

// Customer service: problems with Zamglam reported by the people using it.
//
// A complaint about another party on an order goes through reportApi instead — this is
// "something here is broken", and it goes to the administrators.

// Report a problem. Any signed-in account except an administrator.
export const reportProblem = async (message) => {
  const response = await apiClient.post('/support/problems', { message });
  return response.data;
};

// What I have reported, and whether it has been dealt with.
export const getMyProblems = async () => {
  const response = await apiClient.get('/support/problems/mine');
  return response.data;
};

// The administrators' queue. status: 'open' (default), 'done' or 'all'.
export const getProblems = async (status = 'open') => {
  const response = await apiClient.get('/support/problems', { params: { status } });
  return response.data;
};

// Just the figure behind the notification on the customer service button.
export const getOpenProblemCount = async () => {
  const response = await apiClient.get('/support/problems/count');
  return response.data.open;
};

// Clearing one: it leaves the queue and the count drops by one.
export const markProblemDone = async (id) => {
  const response = await apiClient.patch(`/support/problems/${id}/done`);
  return response.data;
};

// Putting one back, if it was cleared too soon.
export const reopenProblem = async (id) => {
  const response = await apiClient.patch(`/support/problems/${id}/reopen`);
  return response.data;
};
