import { Head, Link } from '@inertiajs/react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import type { BreadcrumbItem } from '@/types';

type CalendarJob = {
    id: number;
    date: string;
    time: string | null;
    title: string;
    customer_name: string | null;
    employee_name: string | null;
};

type Props = {
    year: number;
    month: number;
    jobs: CalendarJob[];
    canSeeAll: boolean;
};

function padMonthQuery(year: number, month: number): string {
    const q = new URLSearchParams();
    q.set('year', String(year));
    q.set('month', String(month));
    return `?${q.toString()}`;
}

function shiftMonth(year: number, month: number, delta: number): {
    year: number;
    month: number;
} {
    const d = new Date(year, month - 1 + delta, 1);
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

function buildMonthCells(year: number, month: number): {
    date: Date;
    inMonth: boolean;
}[] {
    const first = new Date(year, month - 1, 1);
    const mondayOffset = (first.getDay() + 6) % 7;
    const start = new Date(first);
    start.setDate(first.getDate() - mondayOffset);
    const cells: { date: Date; inMonth: boolean }[] = [];
    for (let i = 0; i < 42; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        cells.push({
            date: d,
            inMonth: d.getMonth() === month - 1,
        });
    }
    return cells;
}

function formatYmd(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function isSameDay(a: Date, b: Date): boolean {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

export default function CalendarIndex({
    year,
    month,
    jobs,
    canSeeAll,
}: Props) {
    const { t, i18n } = useTranslation();

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('nav.calendar'), href: '/calendar' },
    ];

    const jobsByDate = useMemo(() => {
        const map = new Map<string, CalendarJob[]>();
        for (const j of jobs) {
            const list = map.get(j.date) ?? [];
            list.push(j);
            map.set(j.date, list);
        }
        return map;
    }, [jobs]);

    const weekdayLabels = useMemo(() => {
        const monday = new Date(2025, 0, 5);
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            return new Intl.DateTimeFormat(i18n.language, {
                weekday: 'short',
            }).format(d);
        });
    }, [i18n.language]);

    const monthTitle = useMemo(() => {
        return new Intl.DateTimeFormat(i18n.language, {
            month: 'long',
            year: 'numeric',
        }).format(new Date(year, month - 1, 1));
    }, [i18n.language, year, month]);

    const cells = useMemo(() => buildMonthCells(year, month), [year, month]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const prev = shiftMonth(year, month, -1);
    const next = shiftMonth(year, month, 1);

    const rows: (typeof cells)[] = [];
    for (let r = 0; r < 6; r++) {
        rows.push(cells.slice(r * 7, r * 7 + 7));
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('calendar.title')} />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-semibold">{t('calendar.title')}</h2>
                        <p className="text-muted-foreground text-sm">
                            {canSeeAll
                                ? t('calendar.description')
                                : t('calendar.descriptionEmployee')}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/calendar">{t('calendar.today')}</Link>
                        </Button>
                        <div className="flex items-center gap-1">
                            <Button variant="outline" size="icon" asChild>
                                <Link
                                    href={`/calendar${padMonthQuery(prev.year, prev.month)}`}
                                    preserveScroll
                                >
                                    <ChevronLeft className="size-4" />
                                </Link>
                            </Button>
                            <Button variant="outline" size="icon" asChild>
                                <Link
                                    href={`/calendar${padMonthQuery(next.year, next.month)}`}
                                    preserveScroll
                                >
                                    <ChevronRight className="size-4" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 text-base font-semibold">
                    <CalendarIcon className="size-5" />
                    <span className="capitalize">{monthTitle}</span>
                </div>

                <div className="overflow-x-auto rounded-lg border border-border">
                    <div className="min-w-[720px]">
                        <div className="grid grid-cols-7 border-b bg-muted/50 text-center text-xs font-medium text-muted-foreground">
                            {weekdayLabels.map((w, i) => (
                                <div
                                    key={i}
                                    className="border-r py-2 last:border-r-0"
                                >
                                    {w}
                                </div>
                            ))}
                        </div>
                        {rows.map((row, ri) => (
                            <div
                                key={ri}
                                className="grid grid-cols-7 border-b last:border-b-0"
                            >
                                {row.map((cell) => {
                                    const key = formatYmd(cell.date);
                                    const dayJobs = jobsByDate.get(key) ?? [];
                                    const isToday = isSameDay(cell.date, today);

                                    return (
                                        <div
                                            key={key}
                                            className={cn(
                                                'min-h-[100px] border-r p-1 last:border-r-0 sm:min-h-[120px] sm:p-2',
                                                !cell.inMonth &&
                                                    'bg-muted/30 text-muted-foreground',
                                                cell.inMonth && 'bg-background',
                                            )}
                                        >
                                            <div
                                                className={cn(
                                                    'mb-1 flex justify-end text-xs font-medium',
                                                    isToday &&
                                                        cell.inMonth &&
                                                        'text-primary',
                                                )}
                                            >
                                                {cell.inMonth && (
                                                    <span
                                                        className={cn(
                                                            'flex size-6 items-center justify-center rounded-full',
                                                            isToday &&
                                                                'bg-primary text-primary-foreground',
                                                        )}
                                                    >
                                                        {cell.date.getDate()}
                                                    </span>
                                                )}
                                                {!cell.inMonth && (
                                                    <span className="text-muted-foreground">
                                                        {cell.date.getDate()}
                                                    </span>
                                                )}
                                            </div>
                                            <ul className="max-h-[72px] space-y-0.5 overflow-y-auto sm:max-h-[88px]">
                                                {dayJobs.map((job) => (
                                                    <li key={job.id}>
                                                        <Link
                                                            href={`/jobs/${job.id}`}
                                                            className="block truncate rounded px-0.5 text-[11px] leading-tight hover:bg-muted sm:text-xs"
                                                            title={job.title}
                                                        >
                                                            {job.time && (
                                                                <span className="font-medium text-muted-foreground">
                                                                    {job.time}{' '}
                                                                </span>
                                                            )}
                                                            <span>{job.title}</span>
                                                        </Link>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
