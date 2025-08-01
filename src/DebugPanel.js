import React from 'react';

const DebugPanel = ({ words, chatHistory, account }) => {
  const testMessage = "hello world test";
  
  const testEncode = () => {
    return testMessage.split(' ').map(word => {
      const index = words.indexOf(word.toLowerCase());
      return { word, index, found: index !== -1 };
    });
  };

  const analyzeIndices = () => {
    const allIndices = chatHistory.flatMap(msg => msg.indices);
    
    // Convertir tous les indices en nombres pour éviter les erreurs BigInt
    const numericIndices = allIndices.map(idx => {
      try {
        return Number(idx);
      } catch (e) {
        console.warn('Non-numeric index:', idx);
        return 0;
      }
    });
    
    const maxIndex = numericIndices.length > 0 ? Math.max(...numericIndices) : 0;
    const minIndex = numericIndices.length > 0 ? Math.min(...numericIndices) : 0;
    const invalidCount = numericIndices.filter(idx => 
      !isFinite(idx) || idx >= words.length || idx < 0
    ).length;
    const bigIndices = numericIndices.filter(idx => idx >= words.length).slice(0, 5); // Top 5 problématiques
    
    return { 
      maxIndex, 
      minIndex, 
      invalidCount, 
      totalIndices: numericIndices.length,
      bigIndices,
      dictSize: words.length
    };
  };

  const testResults = words.length > 0 ? testEncode() : [];
  const indexAnalysis = chatHistory.length > 0 ? analyzeIndices() : null;

  return (
    <div className="card" style={{background: '#fff3cd', border: '1px solid #ffeaa7'}}>
      <h3>🔧 Debug Panel</h3>
      
      <div style={{marginBottom: '15px'}}>
        <h4>📚 Dictionary Status</h4>
        <p><strong>Size:</strong> {words.length.toLocaleString()} words</p>
        {words.length > 0 && (
          <>
            <p><strong>First word:</strong> "{words[0]}" (index: 0)</p>
            <p><strong>Last word:</strong> "{words[words.length - 1]}" (index: {words.length - 1})</p>
            <p><strong>Sample (indices 10-15):</strong> {words.slice(10, 16).join(', ')}</p>
          </>
        )}
      </div>

      {words.length > 0 && (
        <div style={{marginBottom: '15px'}}>
          <h4>🧪 Encoding Test</h4>
          <p><strong>Test message:</strong> "{testMessage}"</p>
          <div style={{fontFamily: 'monospace', background: '#f8f9fa', padding: '10px', borderRadius: '4px'}}>
            {testResults.map((result, i) => (
              <div key={i} style={{color: result.found ? 'green' : 'red'}}>
                "{result.word}" → {result.found ? `index ${result.index}` : 'NOT FOUND'}
              </div>
            ))}
          </div>
        </div>
      )}

      {indexAnalysis && (
        <div style={{marginBottom: '15px'}}>
          <h4>📊 Existing Messages Analysis</h4>
          <p><strong>Total indices:</strong> {indexAnalysis.totalIndices}</p>
          <p><strong>Min index:</strong> {indexAnalysis.minIndex.toLocaleString()}</p>
          <p><strong>Max index:</strong> {indexAnalysis.maxIndex.toLocaleString()}</p>
          <p><strong>Dictionary size:</strong> {indexAnalysis.dictSize.toLocaleString()}</p>
          <p><strong>Invalid indices:</strong> {indexAnalysis.invalidCount} 
            {indexAnalysis.maxIndex >= words.length && (
              <span style={{color: 'red'}}> ⚠️ Some indices exceed dictionary size!</span>
            )}
          </p>
          
          {indexAnalysis.bigIndices.length > 0 && (
            <div style={{background: '#f8d7da', padding: '10px', borderRadius: '4px', marginTop: '10px'}}>
              <strong style={{color: 'red'}}>🚨 Problematic indices detected:</strong>
              <div style={{fontFamily: 'monospace', marginTop: '5px'}}>
                {indexAnalysis.bigIndices.map((idx, i) => (
                  <div key={i}>• {idx.toLocaleString()} (exceeds {indexAnalysis.dictSize.toLocaleString()})</div>
                ))}
              </div>
              <p style={{marginTop: '10px', fontSize: '0.9em'}}>
                <strong>Explanation:</strong> These messages were created with a different or corrupted dictionary.
                The indices exceed the current dictionary size.
              </p>
            </div>
          )}
        </div>
      )}

      <div style={{fontSize: '0.9em', color: '#666'}}>
        <h4>💡 Problem Resolution</h4>
        <ul>
          <li>If dictionary is small (&lt;1000 words), check the words.txt file</li>
          <li>If indices are too large, the dictionary may have changed</li>
          <li>Words must be lowercase and contain only letters</li>
          <li>Each line in words.txt file = one word</li>
          <li><strong>Messages with invalid indices:</strong> Created with a different dictionary, 
              they will remain unreadable with the current dictionary</li>
        </ul>
        
        {indexAnalysis && indexAnalysis.invalidCount > 0 && (
          <div style={{background: '#fff3cd', padding: '10px', borderRadius: '4px', marginTop: '10px', border: '1px solid #ffeaa7'}}>
            <strong>🔧 Recommendation:</strong>
            <p>You have {indexAnalysis.invalidCount} invalid indices. For a coherent chat:</p>
            <ol>
              <li>All participants must use the same words.txt file</li>
              <li>The file must never change during usage</li>
              <li>Consider deploying a new contract for a fresh chat</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
};

export default DebugPanel; 