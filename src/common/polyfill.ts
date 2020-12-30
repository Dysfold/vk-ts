// Polyfills that will be loaded before any other Valtakausi code

Array.prototype.remove = function (this, index: number) {
  this.splice(index, 1);
};

Array.prototype.removeValue = function (this, value: any) {
  const index = this.indexOf(value);
  if (index == -1) {
    return false;
  } else {
    this.remove(index);
    return true;
  }
};
