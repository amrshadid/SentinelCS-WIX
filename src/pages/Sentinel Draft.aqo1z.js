import { testPhoneFormatter } from 'backend/example-test.web';

$w.onReady(async function () {
  $w('#text42').text = 'Sentinel Cloud Service\nRepository test\nFrontend: PASS\nBackend: checking…';
  console.log('SENTINEL_TEST: frontend running');
  try {
    const result = await testPhoneFormatter();
    if (result.formatted !== result.expected) throw new Error('Unexpected formatter result');
    $w('#text42').text = 'Sentinel Cloud Service\nRepository test\nFrontend: PASS\nBackend: PASS\n' + result.formatted;
    console.log('SENTINEL_TEST: backend PASS — ' + result.formatted);
  } catch (error) {
    $w('#text42').text = 'Sentinel Cloud Service\nFrontend: PASS\nBackend: FAILED\nSee the developer console.';
    console.error('SENTINEL_TEST: backend FAIL — ' + error.message);
  }
});
