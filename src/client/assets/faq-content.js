import bmcLogo from '../assets/bmc.png';

const faqContent = {
  title: "",
  rows: [
    {
      title: "How is this free? Do you sell my data?",
      content: "blymp.io can be used for free because of its underlying architecture:<br />blymp.io tries to transfer files using a peer-to-peer connection, meaning no server needs to be used. Due to this, the hosting for blymp.io is fairly cheep for me, so I can also offer it for free.<br /><br />Even though its free, blymp.io does not save or sell your data!<br /><br />If you'd like to support blymp.io and help keep the service running, please consider donating:<br /><br /><a href=\"https://www.buymeacoffee.com/vantezzen\" target=\"_blank\" rel='noopener'><img src=\"" + bmcLogo + "\" alt=\"Buy Me A Coffee\" width=\"150\" /></a>"
    },
    {
      title: "How fast will the files be transferred?",
      content: "Transfer speeds depend on a lot of factors, e.g. if your devices are in the same network, your internet speed, whether we can use Peer-to-peer technologies and many more. This is why we can't give an exact transfer speed but we will calculate an estimate time remaining while you transfer a file."
    },
    {
      title: "How many files can I transfer? How large can the files be?",
      content: "blymp.io allows you to transfer an unlimited amount of files - we don't limit the number of files you can select!<br /><br />The maximum file size a single file can have depends on factors with the receiving device so we can't give an exact amount but we already successfully transferred files with a size of multiple Gigabytes."
    },
    {
      title: "How do you transfer my files?",
      content: "Short answer: To achieve the best compatability with all kinds of devices, blymp.io can use different technologies to transfer your files.<br /><br />If you want to get a more technical answer: At first, it tries to create a <a href='https://en.wikipedia.org/wiki/WebRTC'>WebRTC</a> (Peer-to-Peer) connection. With this connection, files can be transferred very directly without needing to go through our servers.<br />If one of the devices doesn't support WebRTC though, blymp.io tries to use a <a href='https://en.wikipedia.org/wiki/WebSocket'>WebSocket</a> connection which still provides reasonable speeds but isn't a Peer-to-peer connection.<br />If both of those methods don't work, blymp.io will use <a href='https://en.wikipedia.org/wiki/XMLHttpRequest'>XMLHttpRequests</a>, which is a technology supported by almost all browsers but only provides slow transfer speeds.<br /><br />You can see which of those technologies blymp.io uses when transferring files and you can check if your current browser supports fast transfer speeds on our <a href='#/compatibility'>compatibility check</a>."
    },
    {
      title: "Where can I see the source code?",
      content: "blymp.io's complete source code is open source and can be seen at <a href='https://github.com/vantezzen/blymp-io'>https://github.com/vantezzen/blymp-io</a>"
    },
    {
      title: "Can I contribute to blymp.io?",
      content: "Yes, contributors are always welcome! If you have some experience with JavaScript and ReactJS, you can dive right into the code at <a href='https://github.com/vantezzen/blymp-io'>https://github.com/vantezzen/blymp-io</a>"
    },
  ],
};

export default faqContent;