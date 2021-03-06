import { render } from 'react-dom';
import StablePayWidget from './StablePayWidget';
// import StablePayButton from './StablePayButton';

// import * as Sentry from '@sentry/react';
// import { Integrations } from '@sentry/tracing';
// import { CaptureConsole } from '@sentry/integrations';

// TODO: -- Get Sentry DSN
// Sentry.init({
//   dsn: process.env.REACT_APP_SENTRY_DSN,
//   environment: config.global.environment,
//   integrations: [
//     new Integrations.BrowserTracing(),
//     new CaptureConsole({ levels: ['error'] })
//   ],

//   // We recommend adjusting this value in production, or using tracesSampler
//   // for finer control
//   tracesSampleRate: 1.0,
// });

const rootElement = document.getElementById('kado-stable-pay-widget');
rootElement &&
  render(<StablePayWidget open={true} subtotal={1999} tax={435} shippingCost={0} price={2434} onClose={() => {}} widgetId={98765} />, rootElement);
  // render(<StablePayButton />, rootElement);

export { default as StablePayButton } from './StablePayButton';
export default StablePayWidget;
