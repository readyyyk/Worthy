'use client';

import { type FC, Suspense } from 'react';
import { api } from '@/trpc/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_components/ui/card';
import { Button } from '@/app/_components/ui/button';
import { Badge } from '@/app/_components/ui/badge';
import { useRouter } from 'next/navigation';
import EditTemplate from './edit';
import DeleteTemplate from './delete';

const TemplatesList: FC = () => {
    const { data: templates, isLoading } = api.templates.getList.useQuery();
    const router = useRouter();
    
    if (isLoading) {
        return <div className="text-center py-8">Загрузка...</div>;
    }
    
    if (!templates?.length) {
        return (
            <div className="text-center py-8">
                <p className="mb-4">У вас пока нет сохраненных шаблонов</p>
                <Button onClick={() => router.push('/new?isIncome=false')}>
                    Создать новую транзакцию
                </Button>
            </div>
        );
    }
    
    return (
        <div className="space-y-4">
            {templates.map((template) => (
                <Card key={`template-${template.id}`} className="w-full">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xl">{template.name}</CardTitle>
                        <div className="flex space-x-2">
                            <EditTemplate template={template} />
                            <DeleteTemplate templateId={template.id} />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex justify-between mb-2">
                            <span className={template.isIncome ? 'text-green-600' : 'text-red-600'}>
                                {template.isIncome ? '+' : '-'}{template.amount} {template.currency}
                            </span>
                            <span className="text-gray-500">{template.description}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {template.tags.map((tag, index) => (
                                <Badge key={`tag-${tag}-${index}`} variant="secondary">
                                    {tag}
                                </Badge>
                            ))}
                        </div>
                        <div className="mt-4">
                            <Button 
                                variant="outline" 
                                className="w-full"
                                onClick={() => router.push(`/new?isIncome=${template.isIncome}&template=${template.id}`)}
                            >
                                Использовать шаблон
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};

const Page: FC = () => {
    return (
        <div className="container mx-auto py-8">
            <h1 className="text-3xl font-bold mb-6 text-center">Шаблоны транзакций</h1>
            <Suspense fallback={<div className="text-center py-8">Загрузка...</div>}>
                <TemplatesList />
            </Suspense>
        </div>
    );
};

export default Page;