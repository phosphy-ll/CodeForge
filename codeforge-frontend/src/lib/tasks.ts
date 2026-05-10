import { api } from "@/lib/api";

export type TaskCard = {
  id: number;
  title: string;
  description: string | null;
  task_type: string;
  verification_type: string;
  status: string;
  difficulty: number | null;
  estimated_minutes: number | null;
  reward_points: number;
  required_score: number;
  is_required: boolean;
  unlock_condition_text: string | null;
  attempts_used: number;
  failed_attempts: number;
  attempts_left: number;
  last_submission_status: string | null;
  last_submission_score: number | null;
  last_submission_feedback: string | null;
  manual_review_requested: boolean;
  can_submit: boolean;
  can_skip: boolean;
  can_request_manual_review: boolean;
};

export async function getMilestoneTaskCards(milestoneId: number): Promise<TaskCard[]> {
  const response = await api.get(`/tasks/milestone/${milestoneId}/cards`);
  return response.data;
}

export async function skipTask(taskId: number) {
  const response = await api.post(`/tasks/${taskId}/skip`);
  return response.data;
}