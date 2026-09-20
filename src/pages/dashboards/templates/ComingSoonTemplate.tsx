import { Card, Result } from 'antd';

/**
 * Placeholder for gallery templates that do not yet have a wired backend form.
 * Each one becomes a real form once its .docx and fields are provided.
 */
export default function ComingSoonTemplateForm() {
  return (
    <Card className="max-w-4xl mx-auto mt-6">
      <Result
        status="info"
        title="Bu shablon hali tayyor emas"
        subTitle="Hujjat (.docx) va maydonlar berilgach, bu sertifikat backendga ulanadi."
      />
    </Card>
  );
}
