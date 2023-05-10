const {createApp} = Vue

createApp({
  data() {
    return {
      tags: [],
      baseVersion: null,
      upgradeVersion: null,
      diffString: "",
      showResult: false,
      showModal: false,
      showSpinner: false,
    };
  },

  mounted() {
    fetch('tags.txt')
      .then(response => response.text())
      .then(data => this.tags = data.trim().split('\n'));
  },

  methods: {
    toggleModal() {
      this.showModal = !this.showModal
    },

    clearResult() {
      this.diffString = "";
      this.showResult = false;
    },

    baseVersionChange() {
      this.upgradeVersion = this.upgradableVersions[0] || null;
      this.clearResult();
    },

    showDiff() {
      if (!this.tags.includes(this.baseVersion) ||
        !this.tags.includes(this.upgradeVersion)
      ) {
        alert('Please select version.');
        return;
      }

      this.showSpinner = true;

      this.showResult = true;
      this.diffString = '';

      fetch(this.diffFileLink)
        .then(response => {
          if (!response.ok) {
            alert('Cannot find diff');

            throw new Error("Cannot find diff");
          }

          return response.text();
        })
        .then(diffString => {
          this.diffString = diffString;
          this.showSpinner = false;

          document.getElementById('showBtn').scrollIntoView({behavior: "smooth"});
        });
    },
  },

  computed: {
    releaseLink() {
      return 'https://github.com/laravel/laravel/releases/tag/' + this.upgradeVersion;
    },

    guideLink() {
      const majorVersion = this.upgradeVersion.split('.').pop();
      const version = majorVersion >= 6 ? majorVersion + '.x' : this.upgradeVersion.split('.').slice(1, 3).join('.');

      return 'https://laravel.com/docs/' + version + '/upgrade';
    },

    diffFileLink() {
      return `diffs/${this.baseVersion}...${this.upgradeVersion}.diff`;
    },

    diffHtml() {
      return Diff2Html.html(this.diffString, {
        drawFileList: true,
        fileListToggle: true,
        fileListStartVisible: false,
        fileContentToggle: false,
        matching: 'lines',
        outputFormat: 'side-by-side',
        synchronizedScroll: true,
        highlight: true,
        renderNothingWhenEmpty: false,
      });
    },

    upgradableVersions() {
      if (!this.baseVersion) {
        return [];
      }

      let sameVersionTags = this.tags.filter(tag => {
        let sliceLength = this.baseVersion.slice(0, 2) === 'v5' ? 4 : 2;
        return tag.slice(0, sliceLength) === this.baseVersion.slice(0, sliceLength) &&
          this.baseVersion.localeCompare(
            tag,
            undefined,
            {numeric: true, sensitivity: 'base'}
          ) === -1
      });

      const lastIndex = sameVersionTags.length > 0 ?
        this.tags.indexOf(sameVersionTags[sameVersionTags.length - 1]) :
        this.tags.indexOf(this.baseVersion)

      if (lastIndex < this.tags.length - 1) {
        sameVersionTags.push(this.tags[lastIndex + 1])
      }

      return sameVersionTags
    },
  },
}).mount('#app')
