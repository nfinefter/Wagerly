import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getCircle, listCircleMembers } from '@/lib/data';
import { Avatar } from '@/components/avatar';
import { Card } from '@/components/ui/card';

export function CircleMembersPage() {
  const { id } = useParams<{ id: string }>();
  const [circleName, setCircleName] = useState('');
  const [members, setMembers] = useState<Awaited<ReturnType<typeof listCircleMembers>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([getCircle(id), listCircleMembers(id)])
      .then(([c, m]) => {
        setCircleName(c.name);
        setMembers(m);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="text-muted">Loading…</p>;

  return (
    <div className="space-y-6">
      <div>
        <Link to={`/circles/${id}`} className="text-sm text-muted hover:text-foreground">
          ← {circleName}
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Members</h1>
      </div>

      <div className="space-y-2">
        {members.map((m) => (
          <Card key={m.user?.id} className="flex items-center gap-3">
            <Avatar name={m.user?.displayName ?? m.user?.email} src={m.user?.avatarUrl} />
            <div className="flex-1">
              <p className="font-medium">{m.user?.displayName ?? m.user?.email}</p>
              <p className="text-xs text-muted capitalize">{m.role.toLowerCase()}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
