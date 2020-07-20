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
      const success = Reflect.defineProperty(target, property, descriptor);
      callback();
      return success;
    },
    deleteProperty(target, property) {
      const success = Reflect.deleteProperty(target, property);
      callback();
      return success;
    },
  };

  return new Proxy(object, handler);
}
