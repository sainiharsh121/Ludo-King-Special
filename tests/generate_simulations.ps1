Add-Type -AssemblyName System.Drawing

function Transform-Image {
    param(
        [string]$InputPath,
        [string]$OutputPath,
        [string]$Type
    )

    $srcBmp = [System.Drawing.Bitmap]::new($InputPath)
    $w = $srcBmp.Width
    $h = $srcBmp.Height
    $destBmp = [System.Drawing.Bitmap]::new($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

    $rect = [System.Drawing.Rectangle]::new(0, 0, $w, $h)
    $srcData = $srcBmp.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadOnly, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $destData = $destBmp.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::WriteOnly, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

    $bytesCount = [Math]::Abs($srcData.Stride) * $h
    $buffer = [byte[]]::new($bytesCount)
    [System.Runtime.InteropServices.Marshal]::Copy($srcData.Scan0, $buffer, 0, $bytesCount)

    for ($i = 0; $i -lt $bytesCount; $i += 4) {
        $b = $buffer[$i]
        $g = $buffer[$i + 1]
        $r = $buffer[$i + 2]

        if ($Type -eq 'grayscale') {
            $gray = [byte](0.2126 * $r + 0.7152 * $g + 0.0722 * $b)
            $buffer[$i]     = $gray
            $buffer[$i + 1] = $gray
            $buffer[$i + 2] = $gray
        } elseif ($Type -eq 'deuteranopia') {
            $nr = [Math]::Min(255, [int](0.625 * $r + 0.375 * $g))
            $ng = [Math]::Min(255, [int](0.700 * $r + 0.300 * $g))
            $nb = [Math]::Min(255, [int](0.300 * $g + 0.700 * $b))
            $buffer[$i]     = [byte]$nb
            $buffer[$i + 1] = [byte]$ng
            $buffer[$i + 2] = [byte]$nr
        } elseif ($Type -eq 'protanopia') {
            $nr = [Math]::Min(255, [int](0.56667 * $r + 0.43333 * $g))
            $ng = [Math]::Min(255, [int](0.55833 * $r + 0.44167 * $g))
            $nb = [Math]::Min(255, [int](0.24167 * $g + 0.75833 * $b))
            $buffer[$i]     = [byte]$nb
            $buffer[$i + 1] = [byte]$ng
            $buffer[$i + 2] = [byte]$nr
        }
    }

    [System.Runtime.InteropServices.Marshal]::Copy($buffer, 0, $destData.Scan0, $bytesCount)
    $srcBmp.UnlockBits($srcData)
    $destBmp.UnlockBits($destData)

    $destBmp.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $srcBmp.Dispose()
    $destBmp.Dispose()
    Write-Host "Generated $OutputPath"
}

Transform-Image 'screenshots\after_board.png' 'screenshots\after_board_grayscale.png' 'grayscale'
Transform-Image 'screenshots\after_board.png' 'screenshots\after_board_deuteranopia.png' 'deuteranopia'
Transform-Image 'screenshots\after_board.png' 'screenshots\after_board_protanopia.png' 'protanopia'

