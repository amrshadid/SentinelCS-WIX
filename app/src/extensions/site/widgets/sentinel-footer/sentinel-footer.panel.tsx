import React, { type FC } from 'react';
import { Box, Button, FormField, Input, InputArea, SidePanel, ToggleSwitch, WixDesignSystemProvider } from '@wix/design-system';
import '@wix/design-system/styles.global.css';
import { Section, SwitchProp, TextProp, useProp } from '../panel-kit';

interface Link {
  label?: string;
  url?: string;
  newTab?: boolean;
  demo?: boolean;
}
interface Column {
  title?: string;
  text?: string;
  links?: Link[];
}

// The footer columns are saved as one JSON list: each column has a title, an optional paragraph and links.
const Columns: FC = () => {
  const [raw, setRaw] = useProp('columns', '[]');
  let columns: Column[] = [];
  try {
    const parsed = JSON.parse(raw || '[]');
    if (Array.isArray(parsed)) columns = parsed;
  } catch (error) {
    columns = [];
  }

  const save = (next: Column[]) => setRaw(JSON.stringify(next));
  const editColumn = (index: number, patch: Column) => save(columns.map((column, at) => (at === index ? { ...column, ...patch } : column)));
  const editLink = (index: number, linkIndex: number, patch: Link) =>
    editColumn(index, { links: (columns[index].links || []).map((link, at) => (at === linkIndex ? { ...link, ...patch } : link)) });

  return (
    <Box direction="vertical" gap="16px">
      {columns.map((column, index) => (
        <Box key={index} direction="vertical" gap="8px" padding="12px" border="1px solid #e0e0e0" borderRadius="8px">
          <Input size="small" placeholder="Column title" value={column.title || ''} onChange={(event) => editColumn(index, { title: event.target.value })} />
          <InputArea rows={2} placeholder="Optional paragraph under the links" value={column.text || ''} onChange={(event) => editColumn(index, { text: event.target.value })} />
          {(column.links || []).map((link, linkIndex) => (
            <Box key={linkIndex} direction="vertical" gap="4px" padding="8px" backgroundColor="#f7f7f7" borderRadius="6px">
              <Input size="small" placeholder="Label" value={link.label || ''} onChange={(event) => editLink(index, linkIndex, { label: event.target.value })} />
              <Input size="small" placeholder="Page, /#section or full address" value={link.url || ''} onChange={(event) => editLink(index, linkIndex, { url: event.target.value })} />
              <FormField label="Open in a new tab" labelPlacement="right" stretchContent={false}>
                <ToggleSwitch size="small" checked={Boolean(link.newTab)} onChange={(event) => editLink(index, linkIndex, { newTab: event.target.checked })} />
              </FormField>
              <Box>
                <Button size="tiny" skin="destructive" priority="secondary" onClick={() => editColumn(index, { links: (column.links || []).filter((_, at) => at !== linkIndex) })}>
                  Remove link
                </Button>
              </Box>
            </Box>
          ))}
          <Box gap="8px">
            <Button size="tiny" priority="secondary" onClick={() => editColumn(index, { links: [...(column.links || []), { label: '', url: '' }] })}>
              Add a link
            </Button>
            <Button size="tiny" skin="destructive" priority="secondary" onClick={() => save(columns.filter((_, at) => at !== index))}>
              Remove column
            </Button>
          </Box>
        </Box>
      ))}
      {columns.length < 4 && (
        <Box>
          <Button size="small" priority="secondary" onClick={() => save([...columns, { title: '', links: [] }])}>
            Add a column
          </Button>
        </Box>
      )}
    </Box>
  );
};

const Panel: FC = () => (
  <WixDesignSystemProvider>
    <SidePanel width="320" height="100vh">
      <SidePanel.Header title="Sentinel footer" />
      <SidePanel.Content noPadding stretchVertically>
        <Section title="Invitation">
          <TextProp name="tag" label="Small heading" placeholder="LAMINATE, by Sentinel" />
          <TextProp name="headline" label="Headline" placeholder="Discover lesions." />
          <TextProp name="headline-emphasis" label="Headline, second line" placeholder="Follow their story." />
          <TextProp name="invitation" label="Text under the headline" multiline />
          <TextProp name="footer-cta-label" label="Button" placeholder="Let's explore your workflow" />
          <TextProp name="footer-cta-url" label="Button goes to" placeholder="/get-started" />
          <TextProp name="caption" label="Text under the button" />
        </Section>

        <Section title="Brand and product">
          <TextProp name="brand-name" label="Company name" placeholder="Sentinel Cloud Service" />
          <TextProp name="home-url" label="Logo links to" placeholder="/" />
          <TextProp name="brand-copy" label="Company text" multiline />
          <TextProp name="product-label" label="Product name" placeholder="LAMINATE" />
          <TextProp name="product-sub" label="Product description" placeholder="Our MRI analysis product" />
          <TextProp name="product-url" label="Product links to" placeholder="/#product" />
        </Section>

        <Section title="Link columns">
          <Columns />
        </Section>

        <Section title="Legal line">
          <TextProp name="legal" label="Text after the copyright year" multiline info="The year is added automatically." />
        </Section>

        <Section title="Behaviour">
          <SwitchProp name="theme" label="Dark theme" onValue="dark" offValue="light" defaultOn={false} />
        </Section>
      </SidePanel.Content>
    </SidePanel>
  </WixDesignSystemProvider>
);

export default Panel;
