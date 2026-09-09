import { requireChatGPTUser } from '@/app/chatgpt-auth';
import { isAdmin } from '@/lib/server';
import Editor from '@/app/admin/editor';

export const dynamic = 'force-dynamic';

export default async function Admin() {
  await requireChatGPTUser('/bebesupcxadmin');
  if (!(await isAdmin()))
    return (
      <main className="admin">
        <h1>설문 관리자 전용 화면입니다</h1>
        <p>등록된 관리자 계정으로 로그인해주세요.</p>
        <a href="/signout-with-chatgpt?return_to=/bebesupcxadmin">
          다른 계정으로 로그인
        </a>
      </main>
    );
  return <Editor />;
}
