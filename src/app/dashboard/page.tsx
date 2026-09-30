import { supabaseServer } from '@/lib/supabase/server';
import ProjectDomainGroupView from '@/components/ProjectDomainGroupView';

export const revalidate = 0; // Always fresh counts

export default async function DomainHubPage() {
  // 1. Fetch projects dynamically from Supabase
  let projectsList: any[] = [];
  try {
    const { data: dbProjects } = await supabaseServer
      .from('projects')
      .select('*')
      .order('id', { ascending: true });
    
    if (dbProjects && dbProjects.length > 0) {
      projectsList = dbProjects;
    }
  } catch (err) {
    console.error('Projects table not created yet in DB:', err);
  }

  // Fallback default project: León del Sur if empty
  if (projectsList.length === 0) {
    projectsList = [
      {
        id: 'proj_leondelsur',
        code: 'leondelsur',
        name: 'León del Sur',
        description: 'Proyecto Portal Noticias León del Sur y subdominios regionales',
      },
    ];
  }

  // 2. Fetch domains dynamically from Supabase
  const { data: dbDomains } = await supabaseServer
    .from('domains')
    .select('*')
    .order('id', { ascending: true });

  const domainsList = dbDomains || [];

  // 3. Fetch article status counts from Supabase
  const { data: articles } = await supabaseServer
    .from('articles')
    .select('domainId, status');

  const counts: Record<string, { inReview: number; published: number; rejected: number; total: number }> = {};

  domainsList.forEach((d) => {
    counts[d.id] = { inReview: 0, published: 0, rejected: 0, total: 0 };
  });

  if (articles) {
    articles.forEach((art) => {
      if (counts[art.domainId]) {
        counts[art.domainId].total += 1;
        if (art.status === 'IN_REVIEW') counts[art.domainId].inReview += 1;
        if (art.status === 'PUBLISHED') counts[art.domainId].published += 1;
        if (art.status === 'REJECTED') counts[art.domainId].rejected += 1;
      }
    });
  }

  return (
    <ProjectDomainGroupView
      initialDomains={domainsList}
      initialProjects={projectsList}
      counts={counts}
    />
  );
}
