import React, { type FC } from 'react';
import { SidePanel, WixDesignSystemProvider } from '@wix/design-system';
import '@wix/design-system/styles.global.css';
import { ListProp, NumberProp, Section, SwitchProp, TextProp } from '../panel-kit';

const Panel: FC = () => (
  <WixDesignSystemProvider>
    <SidePanel width="320" height="100vh">
      <SidePanel.Header title="Sentinel header" />
      <SidePanel.Content noPadding stretchVertically>
        <Section title="Brand">
          <TextProp name="brand-name" label="Company name" placeholder="Sentinel Cloud Service" info="Read by screen readers as the logo's name." />
          <TextProp name="home-url" label="Logo links to" placeholder="/" />
        </Section>

        <Section title="Menu">
          <ListProp
            name="nav"
            label="Menu links"
            addLabel="Add a link"
            columns={[
              { key: 'label', label: 'Label' },
              { key: 'url', label: 'Page, /#section or full address' },
              { key: 'newTab', label: 'Open in a new tab', type: 'switch' },
            ]}
          />
        </Section>

        <Section title="Buttons">
          <TextProp name="sign-in-label" label="Sign-in label" placeholder="Sign in" />
          <TextProp name="sign-in-url" label="Sign-in address" placeholder="https://portal.laminate.nyuad.nyu.edu" />
          <TextProp name="cta-label" label="Main button" placeholder="Book a demo" />
          <TextProp name="cta-short-label" label="Main button on small screens" placeholder="Demo" />
          <TextProp name="cta-url" label="Main button goes to" placeholder="/get-started" />
        </Section>

        <Section title="Behaviour">
          <NumberProp name="compact-at" label="Shrink after scrolling (px)" min={0} max={600} info="The header becomes the small floating bar after this much scrolling. Default 88." />
          <SwitchProp name="mode" label="Float above the page" onValue="fixed" offValue="inline" info="Off keeps the header inside its box instead of fixing it to the screen." />
          <SwitchProp name="theme" label="Dark theme" onValue="dark" offValue="light" defaultOn={false} />
        </Section>
      </SidePanel.Content>
    </SidePanel>
  </WixDesignSystemProvider>
);

export default Panel;
