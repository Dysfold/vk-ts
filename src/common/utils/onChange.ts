export function onChange(object: any, callback: () => void) {
  const handler: ProxyHandler<any> = {
    get(target, property, receiver) {
      try {
        return new Proxy(target[property], handler);
      } catch (err) {
        return Reflect.get(target, property, receiver);
      }
    },
    defineProperty(target, property, descriptor) {
      callback();
      return Reflect.defineProperty(target, property, descriptor);
    },
    deleteProperty(target, property) {
      callback();
      return Reflect.deleteProperty(target, property);
    },
  };

  return new Proxy(object, handler);
}
