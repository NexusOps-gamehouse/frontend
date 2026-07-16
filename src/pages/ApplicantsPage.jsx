import { Navigate, useParams } from 'react-router-dom';

/** 구버전 경로(/post/:id/applicants) 호환용 — 신청자 관리가 상세보기 페이지로 통합됨 */
export default function ApplicantsPage() {
  const { id } = useParams();
  return <Navigate to={`/post/${id}`} replace />;
}
