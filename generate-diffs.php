<?php

define('LARAVEL_FOLDER', 'laravel');
define('DIFF_FOLDER', 'diffs');
define('TAGS_FILE', 'tags.txt');

/**
 * Generate Diff Files
 *
 * @param  float $v1
 * @param  float $v2
 * @return void
 */
function generateDiffFile($v1, $v2)
{
    $file = sprintf('%s/%s...%s.diff', DIFF_FOLDER, $v1, $v2);

    if (!file_exists($file)) {
        exec(sprintf('git --git-dir %s/.git diff %s %s > %s', LARAVEL_FOLDER, $v1, $v2, $file));
    }
}

/**
 * Tag version formatter.
 *
 * @param  string $v
 * @return string
 */
function versionFormat($version)
{
    return str_replace('v', '', $version);
}

if (!file_exists(DIFF_FOLDER)) {
    mkdir(DIFF_FOLDER);
}

if (!file_exists(LARAVEL_FOLDER)) {
    exec(sprintf('git clone https://github.com/laravel/laravel.git %s', LARAVEL_FOLDER));
}

$versionList = shell_exec(sprintf('git --git-dir %s/.git tag --sort=refname | grep -v "v3\|v4\|v5.0\|v5.1\|v5.2\|v5.3\|v5.4" | cat', LARAVEL_FOLDER));
$versionList = explode(PHP_EOL, trim($versionList));

usort($versionList, function ($v1, $v2) {
    return version_compare(versionFormat($v1), versionFormat($v2));
});

file_put_contents(TAGS_FILE, implode(PHP_EOL, $versionList));

foreach ($versionList as $index => $baseVersion) {
    echo $baseVersion.PHP_EOL;

    $latestVersion = null;

    foreach ($versionList as $version) {
        if ($version === $baseVersion) {
            continue;
        }

        if (explode('.', $version)[0] != explode('.', $baseVersion)[0]) {
            continue;
        }

        if (version_compare(versionFormat($baseVersion), versionFormat($version)) === 1) {
            continue;
        }

        $latestVersion = $version;

        generateDiffFile($baseVersion, $version);
    }

    if (!is_null($latestVersion)) {
        $vIndex = array_search($latestVersion, $versionList);
        $vIndex++;

        if (isset($versionList[$vIndex])) {
            generateDiffFile($baseVersion, $versionList[$vIndex]);
        };
    }
}

echo 'DONE';
