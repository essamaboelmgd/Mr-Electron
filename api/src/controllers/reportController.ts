import { Request, Response } from 'express';
import { sendExamResultsReport, sendStudentExamReport, sendStudentReport } from '../services/reportService';

const reportError = (res: Response, error: any) => {
  if (res.headersSent) return;
  res.status(error.statusCode || 500).json({
    status: error.statusCode && error.statusCode < 500 ? 'fail' : 'error',
    message: error.message || 'تعذر إنشاء التقرير'
  });
};

export const downloadStudentReport = async (req: Request, res: Response) => {
  try { await sendStudentReport(res, req.params.userId); } catch (error) { reportError(res, error); }
};

export const downloadExamResultsReport = async (req: Request, res: Response) => {
  try { await sendExamResultsReport(res, req.params.examId); } catch (error) { reportError(res, error); }
};

export const downloadStudentExamReport = async (req: Request, res: Response) => {
  try { await sendStudentExamReport(res, String(req.user?._id), req.params.id, req.query.attemptId as string | undefined); } catch (error) { reportError(res, error); }
};
