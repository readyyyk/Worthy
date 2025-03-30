'use client';

import { type FC } from 'react';
import { api } from '@/trpc/react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_components/ui/select';

interface Props {
    onSelectTemplate: (templateId: number) => void;
}

const TemplateSelector: FC<Props> = ({ onSelectTemplate }) => {
    const { data: templates, isLoading } = api.templates.getList.useQuery();
    
    if (isLoading || !templates?.length) {
        return null;
    }
    
    return (
        <div className="mb-4">
            <Select onValueChange={(value) => onSelectTemplate(Number(value))}>
                <SelectTrigger>
                    <SelectValue placeholder="Выберите шаблон" />
                </SelectTrigger>
                <SelectContent>
                    {templates.map((template) => (
                        <SelectItem key={`template-${template.id}`} value={String(template.id)}>
                            {template.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
};

export default TemplateSelector;