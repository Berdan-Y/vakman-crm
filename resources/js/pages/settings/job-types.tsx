import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import type { BreadcrumbItem } from '@/types';

type JobTypeRow = {
    id: number;
    name: string;
    sort_order: number;
    is_other: boolean;
    jobs_count: number;
};

type Props = {
    jobTypes: JobTypeRow[];
};

export default function JobTypesSettings({ jobTypes }: Props) {
    const { t } = useTranslation();
    const { errors } = usePage().props as { errors?: Record<string, string> };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('settings.jobTypes'), href: '/settings/job-types' },
    ];

    const addForm = useForm({
        name: '',
        is_other: false,
        sort_order: '' as string,
    });

    const [editOpen, setEditOpen] = useState(false);
    const [editing, setEditing] = useState<JobTypeRow | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<JobTypeRow | null>(null);
    const [deleteProcessing, setDeleteProcessing] = useState(false);

    const editForm = useForm({
        name: '',
        is_other: false,
        sort_order: '' as string,
    });

    const openEdit = (row: JobTypeRow) => {
        setEditing(row);
        editForm.setData({
            name: row.name,
            is_other: row.is_other,
            sort_order: String(row.sort_order),
        });
        setEditOpen(true);
    };

    const submitAdd = (e: React.FormEvent) => {
        e.preventDefault();
        addForm.post('/settings/job-types', {
            preserveScroll: true,
            onSuccess: () => {
                addForm.reset();
            },
        });
    };

    const submitEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editing) {
            return;
        }
        editForm.put(`/settings/job-types/${editing.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setEditOpen(false);
                setEditing(null);
            },
        });
    };

    const confirmDelete = () => {
        if (!deleteTarget) {
            return;
        }
        router.delete(`/settings/job-types/${deleteTarget.id}`, {
            preserveScroll: true,
            onBefore: () => setDeleteProcessing(true),
            onFinish: () => {
                setDeleteProcessing(false);
                setDeleteTarget(null);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('settings.jobTypes')} />

            <h1 className="sr-only">{t('settings.jobTypes')}</h1>

            <SettingsLayout>
                <div className="space-y-6">
                    <Heading
                        variant="small"
                        title={t('settings.jobTypes')}
                        description={t('settings.jobTypesDesc')}
                    />

                    <Card>
                        <CardHeader>
                            <CardTitle>{t('settings.addJobType')}</CardTitle>
                            <CardDescription>
                                {t('settings.jobTypesOtherHint')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form
                                onSubmit={submitAdd}
                                className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end"
                            >
                                <div className="grid flex-1 gap-2 sm:min-w-[200px]">
                                    <Label htmlFor="new-name">
                                        {t('common.name')}
                                    </Label>
                                    <Input
                                        id="new-name"
                                        value={addForm.data.name}
                                        onChange={(e) =>
                                            addForm.setData('name', e.target.value)
                                        }
                                        required
                                    />
                                    <InputError message={addForm.errors.name} />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Switch
                                        id="new-is-other"
                                        checked={addForm.data.is_other}
                                        onCheckedChange={(v) =>
                                            addForm.setData('is_other', v)
                                        }
                                    />
                                    <Label
                                        htmlFor="new-is-other"
                                        className="text-sm font-normal"
                                    >
                                        {t('settings.jobTypeRequiresCustomLabel')}
                                    </Label>
                                </div>
                                <div className="grid w-full gap-2 sm:w-32">
                                    <Label htmlFor="new-sort">
                                        {t('settings.sortOrder')}
                                    </Label>
                                    <Input
                                        id="new-sort"
                                        type="number"
                                        min={0}
                                        max={65535}
                                        placeholder="0"
                                        value={addForm.data.sort_order}
                                        onChange={(e) =>
                                            addForm.setData(
                                                'sort_order',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    disabled={addForm.processing}
                                >
                                    <Plus className="mr-2 size-4" />
                                    {t('settings.addJobType')}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>{t('settings.jobTypesList')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {errors?.delete && (
                                <p className="text-destructive mb-4 text-sm">
                                    {errors.delete}
                                </p>
                            )}
                            {jobTypes.length === 0 ? (
                                <p className="text-muted-foreground text-sm">
                                    {t('settings.noJobTypes')}
                                </p>
                            ) : (
                                <div className="overflow-x-auto rounded-md border">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-muted/50 border-b text-left">
                                                <th className="p-3 font-medium">
                                                    {t('common.name')}
                                                </th>
                                                <th className="w-24 p-3 font-medium">
                                                    {t('settings.sortOrder')}
                                                </th>
                                                <th className="w-36 p-3 font-medium">
                                                    {t('settings.customLabel')}
                                                </th>
                                                <th className="w-24 p-3 font-medium">
                                                    {t('settings.usedOnJobs')}
                                                </th>
                                                <th className="w-28 p-3 text-end font-medium">
                                                    {t('common.actions')}
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {jobTypes.map((row) => (
                                                <tr
                                                    key={row.id}
                                                    className="border-b last:border-0"
                                                >
                                                    <td className="p-3 font-medium">
                                                        {row.name}
                                                    </td>
                                                    <td className="p-3">
                                                        {row.sort_order}
                                                    </td>
                                                    <td className="p-3">
                                                        {row.is_other
                                                            ? t('common.yes')
                                                            : t('common.no')}
                                                    </td>
                                                    <td className="p-3">
                                                        {row.jobs_count}
                                                    </td>
                                                    <td className="p-3 text-end">
                                                        <div className="flex justify-end gap-1">
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() =>
                                                                    openEdit(
                                                                        row,
                                                                    )
                                                                }
                                                                aria-label={t(
                                                                    'common.edit',
                                                                )}
                                                            >
                                                                <Pencil className="size-4" />
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                disabled={
                                                                    row.jobs_count >
                                                                    0
                                                                }
                                                                onClick={() =>
                                                                    setDeleteTarget(
                                                                        row,
                                                                    )
                                                                }
                                                                aria-label={t(
                                                                    'common.delete',
                                                                )}
                                                            >
                                                                <Trash2 className="size-4" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Dialog
                        open={deleteTarget !== null}
                        onOpenChange={(open) => {
                            if (!open && !deleteProcessing) {
                                setDeleteTarget(null);
                            }
                        }}
                    >
                        <DialogContent
                            onPointerDownOutside={(e) => {
                                if (deleteProcessing) {
                                    e.preventDefault();
                                }
                            }}
                            onEscapeKeyDown={(e) => {
                                if (deleteProcessing) {
                                    e.preventDefault();
                                }
                            }}
                        >
                            <DialogHeader>
                                <DialogTitle>
                                    {t('settings.jobTypesDeleteConfirm')}
                                </DialogTitle>
                                <DialogDescription>
                                    {deleteTarget
                                        ? t(
                                              'settings.jobTypesDeleteModalDesc',
                                              {
                                                  name: deleteTarget.name,
                                              },
                                          )
                                        : null}
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={deleteProcessing}
                                    onClick={() => setDeleteTarget(null)}
                                >
                                    {t('common.cancel')}
                                </Button>
                                <Button
                                    type="button"
                                    variant="destructive"
                                    disabled={deleteProcessing}
                                    onClick={confirmDelete}
                                >
                                    {t('common.delete')}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={editOpen} onOpenChange={setEditOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>
                                    {t('settings.editJobType')}
                                </DialogTitle>
                                <DialogDescription>
                                    {t('settings.jobTypesOtherHint')}
                                </DialogDescription>
                            </DialogHeader>
                            <form
                                onSubmit={submitEdit}
                                className="space-y-4"
                            >
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-name">
                                        {t('common.name')}
                                    </Label>
                                    <Input
                                        id="edit-name"
                                        value={editForm.data.name}
                                        onChange={(e) =>
                                            editForm.setData(
                                                'name',
                                                e.target.value,
                                            )
                                        }
                                        required
                                    />
                                    <InputError message={editForm.errors.name} />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Switch
                                        id="edit-is-other"
                                        checked={editForm.data.is_other}
                                        onCheckedChange={(v) =>
                                            editForm.setData('is_other', v)
                                        }
                                    />
                                    <Label
                                        htmlFor="edit-is-other"
                                        className="text-sm font-normal"
                                    >
                                        {t('settings.jobTypeRequiresCustomLabel')}
                                    </Label>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-sort">
                                        {t('settings.sortOrder')}
                                    </Label>
                                    <Input
                                        id="edit-sort"
                                        type="number"
                                        min={0}
                                        max={65535}
                                        value={editForm.data.sort_order}
                                        onChange={(e) =>
                                            editForm.setData(
                                                'sort_order',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>
                                <DialogFooter>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setEditOpen(false)}
                                    >
                                        {t('common.cancel')}
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={editForm.processing}
                                    >
                                        {t('common.save')}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
