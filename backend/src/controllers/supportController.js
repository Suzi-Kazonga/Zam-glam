import ProblemReport from '../models/ProblemReport.js';

// Customer service: problems reported to Zamglam, and the administrators who clear them.

// Anybody signed in who is not an administrator can report a problem. An administrator
// reporting a problem to themselves would only clutter their own queue.
export const reportProblem = async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      return res.status(403).json({ error: 'Administrators handle reported problems rather than filing them' });
    }
    const created = await ProblemReport.create({
      user_id: req.user.id,
      role: req.user.role,
      message: req.body.message,
    });
    res.status(201).json({ message: 'Thank you — this has gone to the Zamglam administrators.', ...created });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

// What the reporter has already sent, so they can see it was received.
export const getMyProblems = async (req, res) => {
  try {
    res.json(await ProblemReport.listMine({ user_id: req.user.id, role: req.user.role }));
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

// The administrators' queue. ?status=all includes the ones already dealt with.
export const listProblems = async (req, res) => {
  try {
    const status = req.query.status === 'all' || req.query.status === 'done' ? req.query.status : 'open';
    const reports = await ProblemReport.list({ status });
    res.json({ reports, open: await ProblemReport.openCount() });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

// Just the figure, for the badge on the customer service button.
export const getOpenCount = async (req, res) => {
  try {
    res.json({ open: await ProblemReport.openCount() });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

// Marking one done removes it from the queue and from the count.
export const markProblemDone = async (req, res) => {
  try {
    const result = await ProblemReport.markDone(req.params.id);
    res.json({ message: 'Marked done', ...result, open: await ProblemReport.openCount() });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

// Put one back in the queue, for a problem closed too soon.
export const reopenProblem = async (req, res) => {
  try {
    const result = await ProblemReport.reopen(req.params.id);
    res.json({ message: 'Reopened', ...result, open: await ProblemReport.openCount() });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};
