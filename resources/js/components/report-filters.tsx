import { router } from '@inertiajs/react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type Props = {
    period: string;
    dateFrom?: string;
    dateTo?: string;
    routePath: string;
};

export function ReportFilters({ period, dateFrom, dateTo, routePath }: Props) {
    const applyFilters = (updates: Record<string, string>) => {
        const params: Record<string, string> = {};
        
        if (updates.period) {
            params.period = updates.period;
            
            // Only include date_from and date_to if we're in custom mode
            if (updates.period === 'custom') {
                if (updates.date_from || dateFrom) {
                    params.date_from = updates.date_from || dateFrom || '';
                }
                if (updates.date_to || dateTo) {
                    params.date_to = updates.date_to || dateTo || '';
                }
            }
        } else {
            // Updating dates within custom mode
            if (period === 'custom') {
                params.period = 'custom';
                if (updates.date_from !== undefined) {
                    params.date_from = updates.date_from;
                } else if (dateFrom) {
                    params.date_from = dateFrom;
                }
                if (updates.date_to !== undefined) {
                    params.date_to = updates.date_to;
                } else if (dateTo) {
                    params.date_to = dateTo;
                }
            }
        }
        
        router.get(routePath, params, { preserveState: true });
    };

    const handlePeriodChange = (value: string) => {
        applyFilters({ period: value });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Filters</CardTitle>
                <CardDescription>Select date range for this report</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-end gap-4">
                <div className="grid gap-2">
                    <Label>Period</Label>
                    <Select value={period} onValueChange={handlePeriodChange}>
                        <SelectTrigger className="w-[160px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="week">This week</SelectItem>
                            <SelectItem value="month">This month</SelectItem>
                            <SelectItem value="year">This year</SelectItem>
                            <SelectItem value="custom">Custom range</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                
                {period === 'custom' && (
                    <>
                        <div className="grid gap-2">
                            <Label>From</Label>
                            <Input
                                type="date"
                                value={dateFrom || ''}
                                onChange={(e) => applyFilters({ date_from: e.target.value })}
                                className="w-[140px]"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>To</Label>
                            <Input
                                type="date"
                                value={dateTo || ''}
                                onChange={(e) => applyFilters({ date_to: e.target.value })}
                                className="w-[140px]"
                            />
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
