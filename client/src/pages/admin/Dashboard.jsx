import { Link } from 'react-router-dom';
import { Eye, AlertTriangle, Inbox, Plus, Users, FolderTree, Receipt, PoundSterling, PackageCheck, Scissors } from 'lucide-react';
import useApi from '../../hooks/useApi';
import { PageHeader, Card, StatusBadge } from '../../components/admin/AdminUI';
import { PageLoader } from '../../components/ui/Spinner';
import Alert from '../../components/ui/Alert';
import Button from '../../components/ui/Button';
import { OrderStatusBadge } from '../../components/orders/OrderSummary';
import { formatClassDay, formatClassTime, formatDate, formatPrice, sizedImage } from '../../utils/format';

const statusTone = { new: 'terracotta', 'in-progress': 'amber', resolved: 'green' };

export default function Dashboard() {
  const { data, loading, error, reload } = useApi('/admin/stats');

  if (loading) return <PageLoader />;
  if (error)
    return (
      <Alert type="error" title="Couldn't load the dashboard" action={<button onClick={reload} className="text-sm underline">Retry</button>}>
        {error}
      </Alert>
    );

  const { stats, recentEnquiries, lowStockList, lowStockThreshold, recentOrders = [] } = data;
  const cards = [
    { label: 'Orders to fulfil', value: stats.ordersToFulfil, Icon: PackageCheck, to: '/admin/orders?status=active', hint: 'Paid or processing' },
    { label: 'Paid orders', value: stats.paidOrders, Icon: Receipt, to: '/admin/orders' },
    { label: 'Revenue', value: formatPrice(stats.revenue), Icon: PoundSterling, to: '/admin/orders', hint: 'Paid orders, before refunds' },
    { label: 'New enquiries', value: stats.newEnquiries, Icon: Inbox, to: '/admin/enquiries?status=new' },
    { label: 'Active products', value: stats.activeProducts, Icon: Eye, to: '/admin/products?status=published', hint: `of ${stats.totalProducts} total` },
    { label: 'Low stock', value: stats.lowStockProducts + stats.outOfStock, Icon: AlertTriangle, to: '/admin/products', hint: `${stats.outOfStock} sold out` },
  ];

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="An overview of your shop."
        actions={
          <Button to="/admin/products/new" size="sm">
            <Plus className="size-4" aria-hidden /> Add product
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(({ label, value, Icon, to, hint }) => (
          <Link key={label} to={to} className="group">
            <Card className="p-5 transition-shadow group-hover:shadow-md">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium tracking-wide text-muted uppercase">{label}</p>
                <Icon className="size-5 text-terracotta" strokeWidth={1.5} aria-hidden />
              </div>
              <p className="mt-3 font-serif text-4xl text-charcoal">{value}</p>
              {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <Card className="xl:col-span-2">
          <div className="flex items-center justify-between border-b border-beige px-5 py-4">
            <h2 className="text-2xl">Recent orders</h2>
            <Link to="/admin/orders" className="text-sm text-terracotta hover:underline">
              View all
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted">No orders yet.</p>
          ) : (
            <ul className="divide-y divide-beige">
              {recentOrders.map((o) => (
                <li key={o._id}>
                  <Link to={`/admin/orders?id=${o._id}`} className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-cream">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium tracking-wide">{o.orderNumber}</p>
                      <p className="text-xs text-muted">
                        {o.customer?.name} · {formatDate(o.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm">{formatPrice(o.total)}</span>
                      <OrderStatusBadge status={o.status} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between border-b border-beige px-5 py-4">
            <h2 className="text-2xl">Recent enquiries</h2>
            <Link to="/admin/enquiries" className="text-sm text-terracotta hover:underline">
              View all
            </Link>
          </div>
          {recentEnquiries.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted">No enquiries yet.</p>
          ) : (
            <ul className="divide-y divide-beige">
              {recentEnquiries.map((e) => (
                <li key={e._id}>
                  <Link to={`/admin/enquiries?id=${e._id}`} className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-cream">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{e.name}</p>
                      <p className="text-xs text-muted">
                        {e.enquiryType} · {formatDate(e.createdAt)}
                      </p>
                    </div>
                    <StatusBadge tone={statusTone[e.status]}>{e.status}</StatusBadge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between border-b border-beige px-5 py-4">
            <h2 className="text-2xl">Low stock</h2>
            <span className="text-xs text-muted">{lowStockThreshold} or fewer</span>
          </div>
          {lowStockList.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted">Everything is well stocked.</p>
          ) : (
            <ul className="divide-y divide-beige">
              {lowStockList.map((p) => (
                <li key={p._id}>
                  <Link to={`/admin/products/${p._id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-cream">
                    {p.images?.[0] ? (
                      <img src={sizedImage(p.images[0], 80)} alt="" className="size-10 rounded-sm object-cover" />
                    ) : (
                      <span className="size-10 rounded-sm bg-beige" />
                    )}
                    <span className="flex-1 truncate text-sm">{p.name}</span>
                    <StatusBadge tone={p.stock === 0 ? 'red' : 'amber'}>{p.stock === 0 ? 'Sold out' : `${p.stock} left`}</StatusBadge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Link to="/admin/classes" className="sm:col-span-2 xl:col-span-1">
          <Card className="flex items-center gap-4 p-5 hover:shadow-md">
            <Scissors className="size-5 text-sage" aria-hidden />
            <span className="text-sm">
              <strong className="font-medium">{stats.upcomingClassPlaces ?? 0}</strong> upcoming class{' '}
              {stats.upcomingClassPlaces === 1 ? 'place' : 'places'} booked
              {stats.nextClassAt && (
                <span className="block text-xs text-muted">
                  Next class {formatClassDay(stats.nextClassAt)}, {formatClassTime(stats.nextClassAt)}
                </span>
              )}
            </span>
          </Card>
        </Link>
        <Link to="/admin/categories">
          <Card className="flex items-center gap-4 p-5 hover:shadow-md">
            <FolderTree className="size-5 text-sage" aria-hidden />
            <span className="text-sm">
              <strong className="font-medium">{stats.totalCategories}</strong>{' '}
              {stats.totalCategories === 1 ? 'category' : 'categories'}
            </span>
          </Card>
        </Link>
        <Link to="/admin/subscribers">
          <Card className="flex items-center gap-4 p-5 hover:shadow-md">
            <Users className="size-5 text-sage" aria-hidden />
            <span className="text-sm">
              <strong className="font-medium">{stats.subscribers}</strong> newsletter{' '}
              {stats.subscribers === 1 ? 'subscriber' : 'subscribers'}
            </span>
          </Card>
        </Link>
      </div>
    </>
  );
}
