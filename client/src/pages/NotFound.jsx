import { Compass } from 'lucide-react';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import useDocumentTitle from '../hooks/useDocumentTitle';

export default function NotFound() {
  useDocumentTitle('Page not found');
  return (
    <div className="container-page py-16">
      <EmptyState
        icon={Compass}
        title="This page has wandered off"
        action={
          <div className="flex flex-wrap justify-center gap-3">
            <Button to="/">Back to Home</Button>
            <Button to="/shop" variant="outline">
              Shop the Collection
            </Button>
          </div>
        }
      >
        We couldn't find the page you were looking for. It may have moved, or the link might be incorrect.
      </EmptyState>
    </div>
  );
}
