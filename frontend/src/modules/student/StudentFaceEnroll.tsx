import { Camera } from 'lucide-react';
import { Button } from '@/components/primitives/Button';
import { Card, CardContent } from '@/components/primitives/Card';
import { PageHeader } from '@/components/layout/PageHeader';

export default function StudentFaceEnroll() {
    return (
        <div className="space-y-6">
            <PageHeader title="Face Enrollment" description="Upload your face photos for automated attendance" />
            <Card>
                <CardContent>
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-20 h-20 rounded-full bg-primary-50 flex items-center justify-center mb-4">
                            <Camera className="w-10 h-10 text-primary-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-surface-900 mb-2">Upload Face Photos</h3>
                        <p className="text-sm text-surface-500 max-w-sm mb-6">
                            Upload at least 5 clear photos of your face. These will be used to generate your unique facial embedding for automated attendance.
                        </p>
                        <Button size="lg" leftIcon={<Camera className="w-5 h-5" />}>
                            Select Photos
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
