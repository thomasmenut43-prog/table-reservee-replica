import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function MentionsLegalesPage() {
  const { data: content, isLoading } = useQuery({
    queryKey: ['legal-content-mentions'],
    queryFn: async () => {
      const results = await base44.entities.LegalContent.filter({ pageKey: 'mentions_legales' });
      return results[0];
    }
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Skeleton className="h-12 w-3/4 mb-8" />
        <Skeleton className="h-6 w-full mb-4" />
        <Skeleton className="h-6 w-full mb-4" />
        <Skeleton className="h-6 w-2/3" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Link to={createPageUrl('Home')}>
        <Button variant="outline" className="mb-6">
          <ChevronLeft className="h-4 w-4 mr-2" />
          Retour à l'accueil
        </Button>
      </Link>

      <h1 className="text-4xl font-bold text-gray-900 mb-8">
        {content?.title || 'Mentions Légales'}
      </h1>
      
      {content?.content ? (
        <div 
          className="prose prose-slate max-w-none prose-headings:font-bold prose-h2:text-2xl prose-h3:text-xl prose-p:text-gray-700 prose-ul:text-gray-700 prose-ol:text-gray-700"
          dangerouslySetInnerHTML={{ __html: content.content }}
        />
      ) : (
        <div className="text-center py-12 text-gray-500">
          <p>Le contenu de cette page n'est pas encore disponible.</p>
        </div>
      )}
    </div>
  );
}