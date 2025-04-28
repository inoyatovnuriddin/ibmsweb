import { Button, Col, Form, FormProps, Input, Row } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import { useStylesContext } from '../../context';

const { TextArea } = Input;

type Props = FormProps;

export const ContactForm = ({ ...others }: Props) => {
  const stylesContext = useStylesContext();

  return (
    <div>
      <Form layout="vertical" {...others}>
        <Row {...stylesContext?.rowProps}>
          <Col sm={24} lg={12}>
            <Form.Item label="Исм" tooltip="Бу майдонни тўлдириш талаб қилинади">
              <Input />
            </Form.Item>
          </Col>
          <Col sm={24} lg={12}>
            <Form.Item label="Электрон почта" tooltip="Бу майдонни тўлдириш талаб қилинади">
              <Input />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item label="Мавзу" tooltip="Бу майдонни тўлдириш талаб қилинади">
          <Input />
        </Form.Item>
        <Form.Item label="Хабар">
          <TextArea />
        </Form.Item>
        <Form.Item>
          <Button type="primary" icon={<SendOutlined />}>
            Юбориш
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};
