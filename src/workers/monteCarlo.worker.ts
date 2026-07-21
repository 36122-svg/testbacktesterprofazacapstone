self.onmessage = (_event: MessageEvent) => {
  self.postMessage({ status: 'ready' });
};
