import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '../i18n';
import { trpc } from '@/providers/trpc';

export default function AdminPage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { lang, t } = useI18n();
  const a = t.admin;
  const navigate = useNavigate();
  const utils = trpc.useUtils();

  const isAdmin = isAuthenticated && user?.role === 'admin';

  const pendingQuery = trpc.message.pending.useQuery(undefined, { enabled: isAdmin, retry: false });
  const approvedQuery = trpc.message.approved.useQuery(undefined, { enabled: isAdmin, retry: false });

  const approveMutation = trpc.message.approve.useMutation({
    onSuccess: () => {
      utils.message.pending.invalidate();
      utils.message.approved.invalidate();
      utils.message.list.invalidate();
    },
  });
  const removeMutation = trpc.message.remove.useMutation({
    onSuccess: () => {
      utils.message.pending.invalidate();
      utils.message.approved.invalidate();
      utils.message.list.invalidate();
    },
  });

  const goLogin = () => {
    sessionStorage.setItem('postLoginRedirect', '/admin');
    navigate('/login');
  };

  const formatDate = (d: Date) =>
    new Date(d).toLocaleString(lang === 'zh' ? 'zh-CN' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const messageCard = (msg: { id: number; name: string; content: string; createdAt: Date }, pending: boolean) => (
    <li key={msg.id} className="border border-bone/10 p-5">
      <div className="flex items-baseline justify-between gap-4 mb-2">
        <span className="font-display text-[15px] text-bone">{msg.name}</span>
        <span className="font-ui text-[11px] text-bone/35">{formatDate(msg.createdAt)}</span>
      </div>
      <p className="font-ui text-[14px] text-bone/65 leading-[1.8] whitespace-pre-wrap mb-4">
        {msg.content}
      </p>
      <div className="flex gap-3">
        {pending && (
          <button
            onClick={() => approveMutation.mutate({ id: msg.id })}
            disabled={approveMutation.isPending}
            className="font-ui text-[12px] tracking-wider px-4 py-1.5 border border-bronze/60 text-bronze hover:bg-bronze hover:text-[#030303] transition-colors duration-300 disabled:opacity-40"
          >
            {a.approve}
          </button>
        )}
        <button
          onClick={() => removeMutation.mutate({ id: msg.id })}
          disabled={removeMutation.isPending}
          className="font-ui text-[12px] tracking-wider px-4 py-1.5 border border-bone/20 text-bone/50 hover:border-[#c0694a]/60 hover:text-[#c0694a] transition-colors duration-300 disabled:opacity-40"
        >
          {a.remove}
        </button>
      </div>
    </li>
  );

  return (
    <div className="relative min-h-screen bg-obsidian">
      <Navbar />

      <div className="pt-32 pb-24 px-8 lg:px-16 max-w-[1000px] mx-auto">
        <span className="font-accent text-[12px] text-bronze tracking-[0.3em] uppercase block mb-4">
          {a.accent}
        </span>
        <h1 className="font-display text-[clamp(1.6rem,4vw,2.4rem)] text-bone leading-tight mb-12">
          {a.title}
        </h1>

        {isLoading ? (
          <div className="space-y-4">
            <div className="h-4 w-40 bg-bone/10 animate-pulse" />
            <div className="h-4 w-64 bg-bone/5 animate-pulse" />
          </div>
        ) : !isAuthenticated ? (
          <div className="border border-bone/10 p-10 text-center">
            <p className="font-ui text-[14px] text-bone/60 mb-8">{a.loginRequired}</p>
            <button
              onClick={goLogin}
              className="font-ui text-[13px] tracking-[0.2em] px-8 py-3 border border-bronze/60 text-bronze hover:bg-bronze hover:text-[#030303] transition-colors duration-300"
            >
              {a.loginButton}
            </button>
          </div>
        ) : !isAdmin ? (
          <div className="border border-bone/10 p-10 text-center">
            <p className="font-ui text-[14px] text-bone/60 mb-8">{a.notAdmin}</p>
            <button
              onClick={() => logout()}
              className="font-ui text-[13px] tracking-[0.2em] px-8 py-3 border border-bone/20 text-bone/60 hover:text-bone transition-colors duration-300"
            >
              {a.logout}
            </button>
          </div>
        ) : (
          <div className="space-y-16">
            <div className="flex items-center justify-between">
              <p className="font-ui text-[13px] text-bone/50">{user?.name}</p>
              <div className="flex items-center gap-6">
                <button
                  onClick={() => {
                    pendingQuery.refetch();
                    approvedQuery.refetch();
                  }}
                  className="font-ui text-[12px] text-bone/50 hover:text-bronze tracking-wider transition-colors"
                >
                  {a.refresh}
                </button>
                <button
                  onClick={() => logout()}
                  className="font-ui text-[12px] text-bone/50 hover:text-bronze tracking-wider transition-colors"
                >
                  {a.logout}
                </button>
              </div>
            </div>

            {/* 待审核 */}
            <section>
              <h2 className="font-display text-[18px] text-bone mb-6 pb-3 border-b border-bronze/30">
                {a.pendingTitle}
                {pendingQuery.data && pendingQuery.data.length > 0 && (
                  <span className="ml-3 font-accent text-[13px] text-bronze">{pendingQuery.data.length}</span>
                )}
              </h2>
              {!pendingQuery.data || pendingQuery.data.length === 0 ? (
                <p className="font-ui text-[13px] text-bone/35">{a.empty}</p>
              ) : (
                <ul className="space-y-4">{pendingQuery.data.map((m) => messageCard(m, true))}</ul>
              )}
            </section>

            {/* 已展示 */}
            <section>
              <h2 className="font-display text-[18px] text-bone mb-6 pb-3 border-b border-bone/10">
                {a.approvedTitle}
              </h2>
              {!approvedQuery.data || approvedQuery.data.length === 0 ? (
                <p className="font-ui text-[13px] text-bone/35">{a.empty}</p>
              ) : (
                <ul className="space-y-4">{approvedQuery.data.map((m) => messageCard(m, false))}</ul>
              )}
            </section>
          </div>
        )}

        <div className="mt-16 pt-8 border-t border-bone/10">
          <Link to="/" className="link-sweep inline-block font-ui text-[12px] text-bone/40 hover:text-bronze tracking-[0.15em] pb-1 transition-colors duration-300">
            {a.backHome}
          </Link>
        </div>
      </div>
    </div>
  );
}
