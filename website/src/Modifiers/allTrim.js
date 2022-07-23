export default function (x) {
  return x.replace(/\s+/g, " ").replace(/^\s+|\s+$/, "");
}
