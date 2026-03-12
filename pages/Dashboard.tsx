import React, { useEffect, useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useInventoryStore } from '../store/InventoryStore';
import { useUsersStore } from '../store/UsersStore';
import { useAuthStore } from '../store/AuthStore';
import type { InventoryItem } from '../types';
import { getCategoryIcon } from './addItem/constants';
import { canCreate } from '../utils/permissions';

// ─── Status config ───────────────────────────────────────────────────────────

const STATUS_META: Record<
  string,
  { label: string; dot: string; text: string; bg: string; color: string }
> = {
  available: {
    label: 'Disponível',
    dot: 'bg-emerald-500',
    text: 'text-emerald-700 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    color: '#10b981',
  },
  in_use: {
    label: 'Em uso',
    dot: 'bg-blue-500',
    text: 'text-blue-700 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    color: '#3b82f6',
  },
  maintenance: {
    label: 'Manutenção',
    dot: 'bg-orange-500',
    text: 'text-orange-700 dark:text-orange-400',
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    color: '#f97316',
  },
  retired: {
    label: 'Desativado',
    dot: 'bg-slate-400',
    text: 'text-slate-500 dark:text-slate-400',
    bg: 'bg-slate-50 dark:bg-slate-800',
    color: '#94a3b8',
  },
};

// ─── Main Component ───────────────────────────────────────────────────────────

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { items, isLoading, error, refresh } = useInventoryStore();
  const { users } = useUsersStore();
  const { user: currentUser } = useAuthStore();

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const getUserName = (userId: string | undefined) =>
    userId ? (users.find((u) => u.id === userId)?.name ?? '–') : '–';

  const effectiveStatus = (item: InventoryItem) =>
    item.assignedTo ? 'in_use' : item.status;

  // ── KPI counts ──────────────────────────────────────────────────────────────
  const totalItems = items.length;
  const inUseCount = items.filter((i) => effectiveStatus(i) === 'in_use').length;
  const availableCount = items.filter((i) => effectiveStatus(i) === 'available').length;
  const maintenanceCount = items.filter((i) => effectiveStatus(i) === 'maintenance').length;
  const retiredCount = items.filter((i) => effectiveStatus(i) === 'retired').length;
  const utilizationRate = totalItems > 0 ? Math.round((inUseCount / totalItems) * 100) : 0;
  const pct = (n: number) => (totalItems > 0 ? Math.round((n / totalItems) * 100) : 0);

  // ── Donut chart data ─────────────────────────────────────────────────────────
  const statusChartData = useMemo(
    () =>
      [
        { name: 'Em uso', value: inUseCount, color: STATUS_META.in_use.color },
        { name: 'Disponível', value: availableCount, color: STATUS_META.available.color },
        { name: 'Manutenção', value: maintenanceCount, color: STATUS_META.maintenance.color },
        { name: 'Desativado', value: retiredCount, color: STATUS_META.retired.color },
      ].filter((d) => d.value > 0),
    [inUseCount, availableCount, maintenanceCount, retiredCount]
  );

  // ── Horizontal bar chart data ─────────────────────────────────────────────────
  const categoryChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach((item) => {
      const cat = item.category || 'Outros';
      counts[cat] = (counts[cat] ?? 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [items]);

  // ── Top users by items assigned ───────────────────────────────────────────────
  const topUsers = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach((item) => {
      if (item.assignedTo) counts[item.assignedTo] = (counts[item.assignedTo] ?? 0) + 1;
    });
    return Object.entries(counts)
      .map(([id, count]) => {
        const u = users.find((u) => u.id === id);
        return { id, count, name: u?.name ?? 'Desconhecido', department: u?.department ?? '', avatar: u?.avatar ?? '' };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [items, users]);

  // ── Warranty expiring in 60 days ──────────────────────────────────────────────
  const warrantyAlerts = useMemo(() => {
    const now = Date.now();
    const in60 = now + 60 * 24 * 60 * 60 * 1000;
    return items
      .filter((item) => {
        if (!item.warrantyEnd) return false;
        const t = new Date(item.warrantyEnd).getTime();
        return t >= now && t <= in60;
      })
      .sort((a, b) => new Date(a.warrantyEnd).getTime() - new Date(b.warrantyEnd).getTime())
      .slice(0, 5);
  }, [items]);

  // ── Last 5 items ──────────────────────────────────────────────────────────────
  const recentItems = useMemo(() => items.slice(0, 5), [items]);

  const today = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const allowCreate = canCreate(currentUser?.role);

  return (
    <div className="flex-1 px-4 py-6 sm:px-8 bg-background-light dark:bg-background-dark overflow-y-auto">
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Erro ao carregar inventário: {error}
        </div>
      )}

      <div className="max-w-[1280px] mx-auto w-full flex flex-col gap-6 pb-12">

        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Dashboard de Inventário
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 capitalize mt-0.5">{today}</p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            {allowCreate && (
              <button
                onClick={() => navigate('/items/add')}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 active:scale-95 transition-all shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                Adicionar Item
              </button>
            )}
            <button
              onClick={() => navigate('/inventory')}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark text-slate-700 dark:text-slate-300 rounded-lg text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">inventory_2</span>
              Ver Inventário
            </button>
          </div>
        </div>

        {/* ── KPI Cards ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
          <KpiCard
            title="Total de Ativos"
            value={totalItems}
            icon="inventory_2"
            color="blue"
            subtext={`${utilizationRate}% em uso`}
            progress={utilizationRate}
            loading={isLoading}
          />
          <KpiCard
            title="Em Uso"
            value={inUseCount}
            icon="devices"
            color="blue"
            subtext={`${pct(inUseCount)}% do total`}
            progress={pct(inUseCount)}
            loading={isLoading}
          />
          <KpiCard
            title="Disponíveis"
            value={availableCount}
            icon="check_circle"
            color="green"
            subtext={`${pct(availableCount)}% do total`}
            progress={pct(availableCount)}
            loading={isLoading}
          />
          <KpiCard
            title="Em Manutenção"
            value={maintenanceCount}
            icon="build"
            color="orange"
            subtext={`${pct(maintenanceCount)}% do total`}
            progress={pct(maintenanceCount)}
            loading={isLoading}
          />
          <KpiCard
            title="Desativados"
            value={retiredCount}
            icon="cancel"
            color="slate"
            subtext={`${pct(retiredCount)}% do total`}
            progress={pct(retiredCount)}
            loading={isLoading}
          />
        </div>

        {/* ── Charts ─────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">

          {/* Donut – Status */}
          <div className="bg-white dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Status do Inventário</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 mb-5">Distribuição atual por status</p>

            {isLoading ? (
              <div className="h-[200px] flex items-center justify-center">
                <span className="text-sm text-slate-400">Carregando...</span>
              </div>
            ) : statusChartData.length === 0 ? (
              <EmptyState icon="pie_chart" message="Nenhum dado disponível" />
            ) : (
              <div className="flex items-center gap-6">
                <div className="h-[200px] flex-1 min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={58}
                        outerRadius={88}
                        paddingAngle={3}
                        dataKey="value"
                        animationDuration={800}
                      >
                        {statusChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: '10px',
                          border: 'none',
                          boxShadow: '0 4px 20px rgba(0,0,0,.12)',
                          fontSize: '13px',
                        }}
                        formatter={(value: number, name: string) => [`${value} itens`, name]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col gap-3 flex-shrink-0">
                  {statusChartData.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: entry.color }}
                      />
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-none">{entry.name}</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{entry.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Horizontal bar – Categories */}
          <div className="bg-white dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Itens por Categoria</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 mb-5">Total de ativos agrupados por categoria</p>

            {isLoading ? (
              <div className="h-[200px] flex items-center justify-center">
                <span className="text-sm text-slate-400">Carregando...</span>
              </div>
            ) : categoryChartData.length === 0 ? (
              <EmptyState icon="bar_chart" message="Nenhum dado disponível" />
            ) : (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={categoryChartData}
                    layout="vertical"
                    margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
                  >
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={95}
                      tick={{ fontSize: 12, fill: '#94a3b8' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(59,130,246,0.06)' }}
                      contentStyle={{
                        borderRadius: '10px',
                        border: 'none',
                        boxShadow: '0 4px 20px rgba(0,0,0,.12)',
                        fontSize: '13px',
                      }}
                      formatter={(value: number) => [`${value} itens`, 'Total']}
                    />
                    <Bar
                      dataKey="value"
                      fill="#3b82f6"
                      radius={[0, 6, 6, 0]}
                      barSize={14}
                      animationDuration={800}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* ── Insights ───────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">

          {/* Top users */}
          <div className="bg-white dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Usuários com Mais Itens</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Top 5 por itens atribuídos</p>
              </div>
              <button
                onClick={() => navigate('/users')}
                className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
              >
                Ver todos
                <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
              </button>
            </div>
            {isLoading ? (
              <div className="flex flex-col gap-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="w-4 h-3 bg-slate-200 dark:bg-slate-700 rounded" />
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700" />
                    <div className="flex-1 h-3 bg-slate-200 dark:bg-slate-700 rounded" />
                    <div className="w-12 h-5 bg-slate-200 dark:bg-slate-700 rounded-full" />
                  </div>
                ))}
              </div>
            ) : topUsers.length === 0 ? (
              <EmptyState icon="person_off" message="Nenhum item atribuído ainda" />
            ) : (
              <div className="flex flex-col gap-4">
                {topUsers.map((u, i) => {
                  const barWidth = topUsers[0]?.count > 0 ? Math.round((u.count / topUsers[0].count) * 100) : 0;
                  return (
                    <div key={u.id}>
                      <div className="flex items-center gap-3 mb-1.5">
                        <span className="text-xs font-bold text-slate-400 w-4 flex-shrink-0">{i + 1}</span>
                        <div
                          className="w-8 h-8 rounded-full bg-slate-200 bg-cover bg-center flex-shrink-0 border border-slate-200 dark:border-slate-700"
                          style={u.avatar ? { backgroundImage: `url('${u.avatar}')` } : {}}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-white truncate leading-none">{u.name}</p>
                          <p className="text-xs text-slate-400 truncate mt-0.5">{u.department}</p>
                        </div>
                        <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">
                          {u.count} {u.count === 1 ? 'item' : 'itens'}
                        </span>
                      </div>
                      <div className="ml-7 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1">
                        <div
                          className="bg-primary h-1 rounded-full transition-all duration-700"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Warranty alerts */}
          <div className="bg-white dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Garantias a Vencer</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Próximos 60 dias</p>
              </div>
              {warrantyAlerts.length > 0 && (
                <span className="text-xs font-bold text-orange-600 bg-orange-100 dark:bg-orange-900/30 px-2.5 py-0.5 rounded-full">
                  {warrantyAlerts.length} alerta{warrantyAlerts.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
            {isLoading ? (
              <div className="flex flex-col gap-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="w-5 h-5 bg-slate-200 dark:bg-slate-700 rounded" />
                    <div className="flex-1 h-3 bg-slate-200 dark:bg-slate-700 rounded" />
                    <div className="w-10 h-5 bg-slate-200 dark:bg-slate-700 rounded-full" />
                  </div>
                ))}
              </div>
            ) : warrantyAlerts.length === 0 ? (
              <EmptyState icon="verified" message="Nenhuma garantia vencendo nos próximos 60 dias" />
            ) : (
              <div className="flex flex-col gap-3">
                {warrantyAlerts.map((item) => {
                  const end = new Date(item.warrantyEnd);
                  const daysLeft = Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  const urgent = daysLeft <= 15;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border-light dark:border-border-dark hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group"
                      onClick={() => navigate(`/item/${item.id}`)}
                    >
                      <span
                        className={`material-symbols-outlined text-[22px] flex-shrink-0 ${urgent ? 'text-red-500' : 'text-orange-400'}`}
                      >
                        {urgent ? 'warning' : 'schedule'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate group-hover:text-primary transition-colors">
                          {item.model || item.name}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {item.category} · vence {end.toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 ${
                          urgent
                            ? 'text-red-600 bg-red-100 dark:bg-red-900/30'
                            : 'text-orange-600 bg-orange-100 dark:bg-orange-900/30'
                        }`}
                      >
                        {daysLeft}d
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Recent Items Table ─────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 delay-[400ms]">
          <div className="px-6 py-4 border-b border-border-light dark:border-border-dark flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Itens Recentes</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Últimos itens cadastrados no sistema</p>
            </div>
            <button
              onClick={() => navigate('/inventory')}
              className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
            >
              Ver todos
              <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/60 dark:bg-slate-800/40">
                  <th className="px-6 py-3 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Item</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 tracking-wider hidden sm:table-cell">SKU</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Categoria</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Status</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 tracking-wider hidden md:table-cell">Alocado a</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light dark:divide-border-dark">
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3 animate-pulse">
                          <div className="w-9 h-9 rounded-lg bg-slate-200 dark:bg-slate-700 flex-shrink-0" />
                          <div className="flex-1 space-y-1.5">
                            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-32" />
                            <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded w-20" />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden sm:table-cell">
                        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-20 animate-pulse" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded-full w-20 animate-pulse" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-16 animate-pulse" />
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-24 animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : recentItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <EmptyState icon="inventory_2" message="Nenhum item cadastrado ainda" />
                    </td>
                  </tr>
                ) : (
                  recentItems.map((item, index) => {
                    const status = effectiveStatus(item);
                    const meta = STATUS_META[status] ?? STATUS_META.retired;
                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors group animate-in fade-in slide-in-from-bottom-1 fill-mode-forwards"
                        style={{ animationDelay: `${index * 60}ms` }}
                        onClick={() => navigate(`/item/${item.id}`)}
                      >
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="bg-slate-100 dark:bg-slate-800 rounded-lg w-9 h-9 flex items-center justify-center flex-shrink-0 border border-transparent group-hover:border-slate-200 dark:group-hover:border-slate-700 transition-colors">
                              <span className="material-symbols-outlined text-[18px] text-slate-500 group-hover:text-primary transition-colors">
                                {getCategoryIcon(item.category)}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-900 dark:text-white truncate group-hover:text-primary transition-colors">
                                {item.model || item.name}
                              </p>
                              <p className="text-xs text-slate-400 truncate">{item.manufacturer}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-sm font-mono text-slate-500 dark:text-slate-400 hidden sm:table-cell">
                          {item.sku ?? '–'}
                        </td>
                        <td className="px-6 py-3.5">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {item.category}
                          </span>
                        </td>
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${meta.dot}`} />
                            <span className={`text-sm font-medium ${meta.text}`}>{meta.label}</span>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-sm text-slate-600 dark:text-slate-400 hidden md:table-cell">
                          {item.assignedTo ? getUserName(item.assignedTo) : (
                            <span className="text-slate-400">–</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const KPI_STYLES: Record<string, { bg: string; iconText: string; bar: string }> = {
  blue:   { bg: 'bg-blue-100 dark:bg-blue-900/30',    iconText: 'text-blue-600 dark:text-blue-400',    bar: 'bg-blue-500' },
  green:  { bg: 'bg-emerald-100 dark:bg-emerald-900/30', iconText: 'text-emerald-600 dark:text-emerald-400', bar: 'bg-emerald-500' },
  orange: { bg: 'bg-orange-100 dark:bg-orange-900/30', iconText: 'text-orange-600 dark:text-orange-400', bar: 'bg-orange-500' },
  slate:  { bg: 'bg-slate-100 dark:bg-slate-800',     iconText: 'text-slate-500 dark:text-slate-400',  bar: 'bg-slate-400' },
};

type KpiCardProps = {
  title: string;
  value: number;
  icon: string;
  color: 'blue' | 'green' | 'orange' | 'slate';
  subtext: string;
  progress: number;
  loading?: boolean;
};

const KpiCard: React.FC<KpiCardProps> = ({ title, value, icon, color, subtext, progress, loading }) => {
  const c = KPI_STYLES[color];
  return (
    <div className="bg-white dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide leading-tight">{title}</p>
        <span className={`${c.bg} ${c.iconText} rounded-lg p-2 flex-shrink-0`}>
          <span className="material-symbols-outlined text-[18px]">{icon}</span>
        </span>
      </div>
      {loading ? (
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-16" />
      ) : (
        <p className="text-3xl font-bold text-slate-900 dark:text-white leading-none">{value}</p>
      )}
      <div className="flex flex-col gap-1.5">
        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
          <div
            className={`${c.bar} h-1.5 rounded-full transition-all duration-700 ease-out`}
            style={{ width: loading ? '0%' : `${Math.min(100, progress)}%` }}
          />
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">{loading ? '–' : subtext}</p>
      </div>
    </div>
  );
};

const EmptyState: React.FC<{ icon: string; message: string }> = ({ icon, message }) => (
  <div className="flex flex-col items-center justify-center py-8 gap-2 text-slate-400">
    <span className="material-symbols-outlined text-[36px]">{icon}</span>
    <p className="text-sm text-center">{message}</p>
  </div>
);

export default Dashboard;
