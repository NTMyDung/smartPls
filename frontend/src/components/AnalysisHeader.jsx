export default function AnalysisHeader({
    fileName,
    rowCount,
    isEditing,
    editError,
    onEditFile,
  }) {
    return (
      <>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              display: 'inline-block',
            }}
          >
            <div
              style={{
                fontSize: '1.2rem',
                fontWeight: 'bold',
                display: 'inline-block',
              }}
            >
              Tên file:{' '}
              <em style={{ color: 'rgb(0 72 225)' }}>{fileName || 'Không có'}</em>
            </div>
            <button
              type="button"
              onClick={onEditFile}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: '1px solid #1f2937',
                background: '#2c8800',
                color: 'white',
                fontSize: '1rem',
                cursor: 'pointer',
                marginLeft: '10px',
                fontWeight: 'bold',
              }}
            >
              Chỉnh sửa
            </button>
            {editError && (
              <div style={{ color: '#dc2626', fontSize: '12px' }}>{editError}</div>
            )}
          </div>
  
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
              Số lượng:{' '}
              <em style={{ color: 'rgb(0 72 225)' }}>{rowCount}</em>
            </div>
          </div>
        </div>
  
        {isEditing && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 50,
            }}
          >
            <div
              style={{
                background: 'white',
                padding: '24px 32px',
                borderRadius: '12px',
                minWidth: '260px',
                textAlign: 'center',
                boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
              }}
            >
              <div
                style={{
                  borderRadius: '999px',
                  width: '40px',
                  height: '40px',
                  border: '4px solid #e5e7eb',
                  borderTopColor: '#111827',
                  margin: '0 auto 12px',
                  animation: 'spin 1s linear infinite',
                }}
              />
              <div style={{ fontWeight: 600, marginBottom: '4px' }}>Đang tải ....</div>
              <div style={{ fontSize: '13px', color: '#6b7280' }}>
                Vui lòng chờ trong giây lát
              </div>
            </div>
          </div>
        )}
      </>
    );
  }
  
  
  