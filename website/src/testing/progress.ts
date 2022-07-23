class Progress {
  private value: number = 0;

  private linked: Array<[Element, string]> = [];

  addLink(element: Element, property: string) {
    this.linked.push([element, property]);
  }
  removeLink(element: Element, property: string) {
    this.linked = this.linked.filter((e) => {
      return e[0] !== element && e[1] !== property;
    });
  }
  async updatePercent(newpercent: number) {
    this.value = newpercent;
    for (let i = 0; i < this.linked.length; ++i) {
      this.linked[i][0][this.linked[i][1]] = this.value;
    }
    await new Promise((r) => setTimeout(r, 10));
  }
}

function CreateProgress() {
  let progress: Progress = new Progress();
  return progress;
}

export { Progress, CreateProgress };
