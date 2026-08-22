$conn = New-Object -ComObject ADODB.Connection
$conn.Open("Provider=Microsoft.Jet.OLEDB.4.0;Data Source=d:\oscar\gusher\novartis.mdb;")
$rs = $conn.OpenSchema(4, @($null, $null, "Notas"))

while (-not $rs.EOF) {
    $colName = $rs.Fields.Item("COLUMN_NAME").Value
    $colType = $rs.Fields.Item("DATA_TYPE").Value
    $colSize = $rs.Fields.Item("CHARACTER_MAXIMUM_LENGTH").Value
    Write-Host "$colName - Type: $colType, Size: $colSize"
    $rs.MoveNext()
}

$rs.Close()
$conn.Close()
