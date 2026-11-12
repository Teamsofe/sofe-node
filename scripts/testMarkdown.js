const regex = /(\*\*([^*]+)\*\*|__([^_]+)__|`([^`]+)`|(\*([^*]+)\*)|(\[Source:[^\]]+\]))/g;
const line = "**What is a blockchain ledger?**";
let match;
while ((match = regex.exec(line)) !== null) {
  console.log("Full match:", match[0]);
  console.log("Group 1:", match[1]);
  console.log("Group 2 (boldAsterisk):", match[2]);
}
