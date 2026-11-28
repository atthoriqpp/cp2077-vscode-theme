param([string]$Data, [string]$Shot)
# Cyberpunk-style popup for Claude Code hooks. Launched by notify.ps1; -Shot <png> renders a preview and exits.
Add-Type -AssemblyName PresentationFramework, PresentationCore, WindowsBase

$d = Get-Content $Data -Raw -Encoding UTF8 | ConvertFrom-Json
if (-not $Shot) { Remove-Item $Data -ErrorAction SilentlyContinue }
$needs = $d.mode -eq 'needs'
# Per-project accent: each folder keeps its own neon (done mode); input prompts stay red
$palette = '#FCEE0A', '#02D7F2', '#00FF9C', '#FF2BD6', '#7B5CFF', '#FF7A1A'
$h = 0; foreach ($ch in "$($d.proj)".ToCharArray()) { $h += [int][char]$ch }
$accent = if ($needs) { '#FF003C' } else { $palette[$h % $palette.Count] }
$head = if ($needs) { 'PRIORITY CALL' } else { 'INCOMING HOLO' }
$title = if ($needs) { 'INPUT REQUIRED' } else { 'NEW MESSAGE' }
$secs = if ($needs) { 20 } else { 7 }
$W = 340; $H = 100; $gap = 8; $run = 180

# Stack slot: lock the first free slot file; the OS frees it on exit, even after a crash
$slot = 0; $lock = $null
if (-not $Shot) {
  for ($i = 0; $i -lt 6 -and -not $lock; $i++) {
    try { $lock = [IO.File]::Open((Join-Path $env:TEMP "claude-popup-slot-$i.lock"), 'OpenOrCreate', 'ReadWrite', 'None'); $slot = $i } catch {}
  }
}

$ns = 'xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation" xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"'
$outline = 'M0.5,0.5 H323.5 L339.5,16.5 V99.5 H0.5 Z'
$xaml = @"
<Window $ns WindowStyle="None" AllowsTransparency="True" Background="Transparent"
        Topmost="True" ShowInTaskbar="False" ShowActivated="False" ResizeMode="NoResize"
        Width="$($W + $run)" Height="$H">
  <Grid x:Name="Stage">
    <Grid x:Name="Ghosts" Width="$W" HorizontalAlignment="Left"/>
    <Grid x:Name="Root" Width="$W" HorizontalAlignment="Left" Opacity="0" Cursor="Hand">
      <Grid.RenderTransform><TranslateTransform x:Name="Slide" X="$run"/></Grid.RenderTransform>
      <Path x:Name="Bg" Data="$outline" Fill="#F20B0B10" StrokeThickness="1"/>
      <Rectangle Clip="M0,0 H324 L340,16 V100 H0 Z" IsHitTestVisible="False">
        <Rectangle.Fill>
          <DrawingBrush TileMode="Tile" Viewport="0,0,4,3" ViewportUnits="Absolute">
            <DrawingBrush.Drawing><GeometryDrawing Brush="#0CFFFFFF" Geometry="M0,0 H4 V1 H0 Z"/></DrawingBrush.Drawing>
          </DrawingBrush>
        </Rectangle.Fill>
      </Rectangle>
      <Rectangle x:Name="Bar" Width="3" HorizontalAlignment="Left"/>
      <Rectangle x:Name="Foot" Width="40" Height="2" HorizontalAlignment="Right" VerticalAlignment="Bottom" Margin="0,0,10,6"/>
      <Grid HorizontalAlignment="Left" VerticalAlignment="Top" Margin="13,10,0,0" Width="60">
        <Border x:Name="Ring" Width="58" Height="58" VerticalAlignment="Top" BorderThickness="1.5" RenderTransformOrigin="0.5,0.5">
          <Border.RenderTransform><ScaleTransform x:Name="RingScale"/></Border.RenderTransform>
        </Border>
        <Border x:Name="Frame" Width="58" Height="58" VerticalAlignment="Top" BorderThickness="1" Background="#101018" ClipToBounds="True">
          <Grid>
            <Image x:Name="Portrait" Stretch="UniformToFill" Opacity="0.92"/>
            <Rectangle IsHitTestVisible="False">
              <Rectangle.Fill>
                <DrawingBrush TileMode="Tile" Viewport="0,0,3,3" ViewportUnits="Absolute">
                  <DrawingBrush.Drawing><GeometryDrawing Brush="#33000000" Geometry="M0,0 H3 V1 H0 Z"/></DrawingBrush.Drawing>
                </DrawingBrush>
              </Rectangle.Fill>
            </Rectangle>
          </Grid>
        </Border>
        <TextBlock Text="CLAUDE" FontFamily="Consolas" FontSize="9" Foreground="#00F0FF" HorizontalAlignment="Center" Margin="0,62,0,0"/>
      </Grid>
      <StackPanel Margin="84,7,20,10">
        <Grid>
          <TextBlock FontFamily="Bahnschrift SemiCondensed" FontSize="11" TextTrimming="CharacterEllipsis" Margin="0,0,96,0">
            <Run x:Name="Head" Text="INCOMING CALL"/><Run x:Name="Proj" Foreground="#00F0FF"/>
          </TextBlock>
          <TextBlock x:Name="Time" FontFamily="Consolas" FontSize="10" Foreground="#00F0FF" HorizontalAlignment="Right" Margin="0,1,22,0"/>
          <Border x:Name="X" Width="16" Height="16" Background="Transparent" HorizontalAlignment="Right" VerticalAlignment="Top" Margin="0,-1,0,0" ToolTip="Close">
            <Path x:Name="XMark" Data="M4,4 L12,12 M12,4 L4,12" Stroke="#6A6A78" StrokeThickness="1.4"/>
          </Border>
        </Grid>
        <Grid>
          <TextBlock x:Name="TCyan" FontFamily="Bahnschrift SemiBold" FontSize="19" Foreground="#00F0FF" Opacity="0.75">
            <TextBlock.RenderTransform><TranslateTransform x:Name="CyanX" X="-1.2"/></TextBlock.RenderTransform>
          </TextBlock>
          <TextBlock x:Name="TRed" FontFamily="Bahnschrift SemiBold" FontSize="19" Foreground="#FF003C" Opacity="0.75">
            <TextBlock.RenderTransform><TranslateTransform x:Name="RedX" X="1.2"/></TextBlock.RenderTransform>
          </TextBlock>
          <TextBlock x:Name="TMain" FontFamily="Bahnschrift SemiBold" FontSize="19"/>
        </Grid>
        <TextBlock x:Name="Msg" FontFamily="Consolas" FontSize="11" Foreground="#CFCFD6" TextWrapping="Wrap"
                   TextTrimming="CharacterEllipsis" MaxHeight="28" Margin="0,3,0,0"/>
        <TextBlock x:Name="Sess" FontFamily="Consolas" FontSize="10" Foreground="#6E6E86"
                   TextTrimming="CharacterEllipsis" Margin="0,4,0,0"/>
      </StackPanel>
    </Grid>
  </Grid>
</Window>
"@

$win = [Windows.Markup.XamlReader]::Parse($xaml)
$f = { param($n) $win.FindName($n) }
$brush = (New-Object Windows.Media.BrushConverter).ConvertFromString($accent)
(& $f 'Bg').Stroke = $brush; (& $f 'Bar').Fill = $brush; (& $f 'Foot').Fill = $brush
(& $f 'Head').Foreground = $brush; (& $f 'TMain').Foreground = $brush
foreach ($n in 'TCyan', 'TRed', 'TMain') { (& $f $n).Text = $title }
(& $f 'Head').Text = $head
(& $f 'Time').Text = (Get-Date -Format 'HH:mm:ss')
(& $f 'Proj').Text = '  > ' + "$($d.proj)".ToUpper()
(& $f 'Msg').Text = $d.msg
$foot = @()
if ("$($d.dur)".Trim()) { $foot += 'RUN ' + $d.dur }
if ("$($d.sess)".Trim()) { $foot += 'SESSION // ' + $d.sess }
if ($foot.Count) { (& $f 'Sess').Text = ($foot -join '   ') } else { (& $f 'Sess').Visibility = 'Collapsed' }

# Holocall: caller portrait with a ringing pulse
(& $f 'Ring').BorderBrush = $brush; (& $f 'Frame').BorderBrush = $brush
$pic = Join-Path $PSScriptRoot 'notify-assets\logo-full.png'
if (Test-Path $pic) { (& $f 'Portrait').Source = New-Object Windows.Media.Imaging.BitmapImage ([Uri]$pic) }
$win.Add_Loaded({
    $dur = [Windows.Duration]::new([TimeSpan]::FromMilliseconds(900))
    $grow = New-Object Windows.Media.Animation.DoubleAnimation 1, 1.35, $dur
    $grow.RepeatBehavior = New-Object Windows.Media.Animation.RepeatBehavior 4
    $fadeRing = New-Object Windows.Media.Animation.DoubleAnimation 0.9, 0, $dur
    $fadeRing.RepeatBehavior = New-Object Windows.Media.Animation.RepeatBehavior 4
    $sc = & $f 'RingScale'
    $sc.BeginAnimation([Windows.Media.ScaleTransform]::ScaleXProperty, $grow)
    $sc.BeginAnimation([Windows.Media.ScaleTransform]::ScaleYProperty, $grow)
    (& $f 'Ring').BeginAnimation([Windows.UIElement]::OpacityProperty, $fadeRing)
  })

# Sandevistan afterimages: colour ghosts of the panel that trail the slide-in and fade
$ghostCols = '#00FF9C', '#00F0FF', '#7B5CFF', '#FF2BD6', '#FCEE0A'
$ghosts = foreach ($c in $ghostCols) {
  $g = [Windows.Markup.XamlReader]::Parse(@"
<Grid $ns Opacity="0" IsHitTestVisible="False">
  <Grid.RenderTransform><TranslateTransform X="$run"/></Grid.RenderTransform>
  <Path Data="$outline" Stroke="$c" StrokeThickness="1.5" Fill="#26$($c.Substring(1))"/>
  <TextBlock Text="$title" FontFamily="Bahnschrift SemiBold" FontSize="19" Foreground="$c" Margin="84,22,0,0"/>
</Grid>
"@)
  [void](& $f 'Ghosts').Children.Insert(0, $g)
  $g
}

# Placement: bottom-right of the primary screen's work area. SystemParameters.WorkArea can come back
# in device pixels above 100% display scaling, which put the popup partly off-screen at 125%, so the
# work area is read in device pixels from Windows Forms and converted with the window's DPI transform.
Add-Type -AssemblyName System.Windows.Forms
$win.Add_SourceInitialized({
    $src = [Windows.Interop.HwndSource]::FromHwnd((New-Object Windows.Interop.WindowInteropHelper $win).Handle)
    $wa = [Windows.Forms.Screen]::PrimaryScreen.WorkingArea
    $br = $src.CompositionTarget.TransformFromDevice.Transform((New-Object Windows.Point $wa.Right, $wa.Bottom))
    $win.Left = $br.X - $W - 16
    $win.Top = $br.Y - 16 - $H - $slot * ($H + $gap)
  })

function Get-Keys($pairs, [switch]$Linear) {
  $a = New-Object Windows.Media.Animation.DoubleAnimationUsingKeyFrames
  $type = if ($Linear) { 'Windows.Media.Animation.LinearDoubleKeyFrame' } else { 'Windows.Media.Animation.DiscreteDoubleKeyFrame' }
  for ($i = 0; $i -lt $pairs.Count; $i += 2) {
    $kt = [Windows.Media.Animation.KeyTime]::FromTimeSpan([TimeSpan]::FromMilliseconds($pairs[$i]))
    [void]$a.KeyFrames.Add((New-Object $type $pairs[$i + 1], $kt))
  }
  $a
}
$X = [Windows.Media.TranslateTransform]::XProperty
$OP = [Windows.UIElement]::OpacityProperty
function Start-Slide($transform, $delay) {
  $a = New-Object Windows.Media.Animation.DoubleAnimation $run, 0, ([TimeSpan]::FromMilliseconds(640))
  $e = New-Object Windows.Media.Animation.QuarticEase; $e.EasingMode = 'EaseOut'
  $a.EasingFunction = $e; $a.BeginTime = [TimeSpan]::FromMilliseconds($delay)
  $transform.BeginAnimation($X, $a)
}

$win.Add_Loaded({
    (& $f 'Root').BeginAnimation($OP, (Get-Keys @(0, 0, 40, 1, 80, 0.3, 130, 1, 180, 0.6, 230, 1)))
    Start-Slide (& $f 'Slide') 0
    for ($i = 0; $i -lt $ghosts.Count; $i++) {
      $t = 70 * ($i + 1)
      Start-Slide $ghosts[$i].RenderTransform $t
      $ghosts[$i].BeginAnimation($OP, (Get-Keys @(0, 0, $t, 0, ($t + 1), 0.7, ($t + 200), 0.45, ($t + 560), 0) -Linear))
    }
    (& $f 'CyanX').BeginAnimation($X, (Get-Keys @(0, -6, 120, 2, 200, -3, 280, -1.2)))
    (& $f 'RedX').BeginAnimation($X, (Get-Keys @(0, 6, 120, -2, 200, 3, 280, 1.2)))
  })

$close = {
  $fade = New-Object Windows.Media.Animation.DoubleAnimation 1, 0, ([TimeSpan]::FromMilliseconds(250))
  $fade.Add_Completed({ $win.Close() })
  (& $f 'Root').BeginAnimation($OP, $fade)
}

# Click anywhere on the panel to dismiss it
(& $f 'Root').Add_MouseLeftButtonUp({ & $close })
$xb = & $f 'X'
$xb.Add_MouseLeftButtonUp({ param($s, $e) $e.Handled = $true; & $close })
$xb.Add_MouseEnter({ (& $f 'XMark').Stroke = $brush })
$xb.Add_MouseLeave({ (& $f 'XMark').Stroke = (New-Object Windows.Media.BrushConverter).ConvertFromString('#6A6A78') })
$win.Add_Closed({ if ($lock) { $lock.Close() }; [Windows.Threading.Dispatcher]::CurrentDispatcher.InvokeShutdown() })

function Save-Shot($el, $w, $path) {
  $rtb = New-Object Windows.Media.Imaging.RenderTargetBitmap $w, $H, 96, 96, ([Windows.Media.PixelFormats]::Pbgra32)
  $rtb.Render($el)
  $enc = New-Object Windows.Media.Imaging.PngBitmapEncoder
  $enc.Frames.Add([Windows.Media.Imaging.BitmapFrame]::Create($rtb))
  $fs = [IO.File]::Create($path); $enc.Save($fs); $fs.Close()
}

$timer = New-Object Windows.Threading.DispatcherTimer
if ($Shot) {
  $script:tick = 0
  $timer.Interval = [TimeSpan]::FromMilliseconds(170)
  $timer.Add_Tick({
      $script:tick++
      if ($script:tick -eq 2) { Save-Shot (& $f 'Stage') ($W + $run) ($Shot -replace '\.png$', '-mid.png') }
      if ($script:tick -eq 5) { $timer.Stop(); Save-Shot (& $f 'Stage') ($W + $run) $Shot; $win.Close() }
    })
} else {
  $timer.Interval = [TimeSpan]::FromSeconds($secs)
  $timer.Add_Tick({ $timer.Stop(); & $close })
  $wav = if ($needs) { 'C:\Windows\Media\Windows Notify Calendar.wav' } else { 'C:\Windows\Media\Windows Notify System Generic.wav' }
  if (Test-Path $wav) { (New-Object Media.SoundPlayer $wav).Play() }
}
$timer.Start()
$win.Show()
[Windows.Threading.Dispatcher]::Run()
