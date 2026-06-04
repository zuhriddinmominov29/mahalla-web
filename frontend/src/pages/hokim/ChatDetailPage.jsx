import { Navigate, useParams } from 'react-router-dom';
export default function ChatDetailPage() {
  const { userId } = useParams();
  return <Navigate to={`/hokim/chats`} replace />;
}
